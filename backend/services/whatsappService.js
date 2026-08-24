const User = require('../models/User');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

// ── Tunables (override via env if ever needed) ──
const SEND_TIMEOUT_MS = Number(process.env.WHATSAPP_SEND_TIMEOUT_MS) || 15000; // per HTTP attempt
const MAX_SEND_ATTEMPTS = Number(process.env.WHATSAPP_MAX_ATTEMPTS) || 3;       // in-call attempts for transient errors

// Meta error codes that mean the template is not yet usable
const TEMPLATE_NOT_READY_CODES = [
    132001, // Template name does not exist (still in review or not created)
    132000, // Template is not approved yet
    132005, // Template rejected
];

// Meta/auth error codes that will NEVER succeed on an immediate retry — fail fast,
// do NOT waste attempts, and let the caller mark them for human attention.
const PERMANENT_ERROR_CODES = [
    190,    // Access token expired / invalid (needs a new token — cannot self-heal)
    131026, // Message undeliverable (recipient not on WhatsApp / cannot receive)
    131047, // Re-engagement message outside allowed window
    131051, // Unsupported message type
    131052, // Media download error
    100,    // Invalid parameter (bad payload — retrying won't help)
    ...TEMPLATE_NOT_READY_CODES, // handled by fallback; if fallback also fails it's permanent
];

// Transient codes — safe and worth retrying with backoff.
const TRANSIENT_ERROR_CODES = [
    130429, // Rate limit hit
    131056, // Pair rate limit (too many messages to this number in a short time)
    368,    // Temporarily blocked for policy (often clears)
    80007,  // Rate limit issues
    132015, // Template paused (temporary)
    1,      // Unknown / temporary API error
    2,      // Service temporarily unavailable
    4,      // Application request limit reached
];

const isAuthError = (code) => Number(code) === 190 || Number(code) === 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Validate that the WhatsApp credentials exist. Called once at startup so a
 * misconfigured deploy fails LOUD instead of silently dropping every message.
 * Returns true if config looks usable.
 */
function validateWhatsAppConfig() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) {
        console.error('══════════════════════════════════════════════════════════════');
        console.error('[WHATSAPP] ❌ CRITICAL: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID is MISSING.');
        console.error('[WHATSAPP]    Every automated/scheduled/reminder message WILL be dropped.');
        console.error('[WHATSAPP]    Set both in the environment and redeploy.');
        console.error('══════════════════════════════════════════════════════════════');
        return false;
    }
    console.log(`[WHATSAPP] ✅ Config OK — phoneId set, token length ${token.length}.`);
    return true;
}

/** POST to Meta with a hard timeout so a hung connection can never stall a cron loop. */
async function postToMeta(url, options, timeoutMs = SEND_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Core helper — sends a WhatsApp template and returns the result.
 * Retries TRANSIENT failures (network/abort/HTTP 429·5xx/Meta rate-limit) with
 * exponential backoff; fails fast on PERMANENT errors. Throws on final failure so
 * callers can handle/log it. Thrown errors carry:
 *   err.metaError, err.metaErrorCode, err.isRetryable, err.isAuthError
 */
async function sendWhatsAppTemplate(to, templateName, components = []) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.error('[WHATSAPP] ❌ WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not set in env. Cannot send message.');
        return null;
    }

    // Sanitise phone number
    let formattedNumber = String(to).replace(/\D/g, '');
    if (formattedNumber.startsWith('0') && formattedNumber.length === 11) {
        formattedNumber = formattedNumber.substring(1);
    }
    if (formattedNumber.length === 10) {
        formattedNumber = '91' + formattedNumber;
    }

    if (formattedNumber.length < 11) {
        console.error(`[WHATSAPP] ❌ Invalid phone number after formatting: "${formattedNumber}" (original: "${to}")`);
        return null;
    }

    const body = {
        messaging_product: 'whatsapp',
        to: formattedNumber,
        type: 'template',
        template: {
            name: templateName,
            language: { code: 'en' },
            components
        }
    };

    const url = `${WHATSAPP_API_URL}/${phoneId}/messages`;
    let lastError = null;

    // ── Send directly via Meta Cloud API — the single, proven delivery path ──
    // (This is the exact path that manual/test messages use, so automated,
    //  scheduled, reminder and event-triggered messages now behave identically.)
    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
        try {
            console.log(`[WHATSAPP] Sending "${templateName}" to ${formattedNumber}... (attempt ${attempt}/${MAX_SEND_ATTEMPTS})`);

            const response = await postToMeta(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            // HTTP-level transient failure (rate limit / server error) → retry
            if (response.status === 429 || response.status >= 500) {
                lastError = Object.assign(new Error(`Meta HTTP ${response.status}`), {
                    metaErrorCode: response.status, isRetryable: true
                });
                if (attempt < MAX_SEND_ATTEMPTS) {
                    const wait = backoffMs(attempt);
                    console.warn(`[WHATSAPP] ⚠️ HTTP ${response.status} from Meta — retrying in ${wait}ms`);
                    await sleep(wait);
                    continue;
                }
                throw lastError;
            }

            const data = await response.json();

            if (data.error) {
                const code = Number(data.error.code);
                const err = new Error(`WhatsApp API Error: ${data.error.message}`);
                err.metaError = data.error;
                err.metaErrorCode = code;
                err.isAuthError = isAuthError(code);
                err.isRetryable = TRANSIENT_ERROR_CODES.includes(code) && !PERMANENT_ERROR_CODES.includes(code);

                if (err.isAuthError) {
                    console.error('══════════════════════════════════════════════════════════════');
                    console.error(`[WHATSAPP] 🔑 AUTH FAILURE (code ${code}): ${data.error.message}`);
                    console.error('[WHATSAPP]    The WHATSAPP_TOKEN is expired or invalid. ALL sends will fail');
                    console.error('[WHATSAPP]    until a fresh Meta token is deployed. Generate a permanent');
                    console.error('[WHATSAPP]    System User token and update WHATSAPP_TOKEN, then redeploy.');
                    console.error('══════════════════════════════════════════════════════════════');
                    throw err; // never retry an auth failure
                }

                if (err.isRetryable && attempt < MAX_SEND_ATTEMPTS) {
                    const wait = backoffMs(attempt);
                    console.warn(`[WHATSAPP] ⚠️ Transient Meta error ${code} ("${data.error.message}") — retrying in ${wait}ms`);
                    lastError = err;
                    await sleep(wait);
                    continue;
                }

                console.error(`[WHATSAPP] ❌ Meta API error for "${templateName}": ${data.error.message} (code: ${code}, fbtrace: ${data.error.fbtrace_id || 'n/a'})`);
                throw err;
            }

            const messageId = data.messages && data.messages[0] ? data.messages[0].id : null;
            console.log(`[WHATSAPP] ✅ Sent "${templateName}" to ${formattedNumber} — wamid: ${messageId}`);
            return { success: true, messageId, formattedNumber, templateUsed: templateName, provider: 'meta' };

        } catch (err) {
            // Network error, DNS, or AbortController timeout → transient, retry
            const networkish = err.name === 'AbortError' || err.name === 'FetchError' ||
                err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' ||
                err.code === 'ECONNREFUSED' || err.code === 'EAI_AGAIN' || /fetch failed|network|timeout/i.test(err.message || '');

            // A classified Meta error (has metaErrorCode) that we decided to throw = final
            if (err.metaErrorCode !== undefined && !networkish) {
                throw err;
            }

            lastError = Object.assign(err, { isRetryable: true });
            if (attempt < MAX_SEND_ATTEMPTS) {
                const wait = backoffMs(attempt);
                console.warn(`[WHATSAPP] ⚠️ Network/timeout error ("${err.message}") — retrying in ${wait}ms`);
                await sleep(wait);
                continue;
            }
            console.error(`[WHATSAPP] ❌ Network error sending "${templateName}" after ${MAX_SEND_ATTEMPTS} attempts: ${err.message}`);
            throw lastError;
        }
    }

    // Exhausted attempts on HTTP/transient path
    throw lastError || new Error('WhatsApp send failed after retries');
}

/** Exponential backoff with jitter: ~1s, ~3s, ~7s ... */
function backoffMs(attempt) {
    const base = Math.min(1000 * (2 ** attempt - 1), 30000);
    return base + Math.floor(Math.random() * 400);
}

/**
 * Smart fallback sender:
 * Tries primaryTemplate first. If Meta rejects it because it’s still in review
 * (error codes 132001/132000/132005), automatically retries with fallbackTemplate.
 * Once primaryTemplate is approved in Meta, it will be used without any code change.
 */
async function sendWithFallback(to, primaryTemplate, fallbackTemplate, components) {
    try {
        return await sendWhatsAppTemplate(to, primaryTemplate, components);
    } catch (err) {
        const code = err.metaErrorCode || (err.metaError && err.metaError.code);
        if (TEMPLATE_NOT_READY_CODES.includes(Number(code))) {
            console.warn(`[WHATSAPP] ⚠️ "${primaryTemplate}" not ready (code ${code}) — auto-falling back to "${fallbackTemplate}"`);
            return await sendWhatsAppTemplate(to, fallbackTemplate, components);
        }
        throw err; // Re-throw real errors (auth, phone, network, etc.)
    }
}

// ─────────────────────────────────────────────────────────────────
// PAYMENT TEMPLATES
// ─────────────────────────────────────────────────────────────────

/**
 * cash_payment_request_template
 * Sent to user when they choose "Cash on Bench" — asks them to bring cash.
 * Header: None (No document/PDF), Body: {{1}}=name, {{2}}=planName, {{3}}=amount
 */
exports.sendPaymentPendingMessage = async (user, paymentData, documentUrl) => {
    if (!user || !user.phone) {
        console.warn('[WHATSAPP] sendPaymentPendingMessage: no user or phone, skipping.');
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendPaymentPendingMessage: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    const bodyParams = [
        { type: 'text', text: String(user.name || 'Member') },
        { type: 'text', text: String(paymentData.planName || 'Plan') },
        { type: 'text', text: String(paymentData.amount || '0').replace(/[^0-9.]/g, '') }
    ];

    console.log('[WHATSAPP] sendPaymentPendingMessage: sending cash_payment_request_template (no PDF).');
    return await sendWhatsAppTemplate(user.phone, 'cash_payment_request_template', [
        { type: 'body', parameters: bodyParams }
    ]);
};

/**
 * payment_receipt_template_fallback
 * Sent after admin confirms a payment (cash/pay-later).
 * Meta Template Body: "Hi {{1}}, your payment of Rs. {{3}} for the {{2}} plan is confirmed.
 *                      Valid from {{4}} to {{5}}."
 * CORRECT order: {{1}}=name, {{2}}=planName, {{3}}=amount, {{4}}=startDate, {{5}}=endDate
 */
exports.sendPaymentConfirmedMessage = async (user, paymentData, documentUrl) => {
    if (!user || !user.phone) {
        console.warn('[WHATSAPP] sendPaymentConfirmedMessage: no user or phone, skipping.');
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendPaymentConfirmedMessage: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    // FIXED: Correct Meta template parameter order:
    // {{1}}=Name, {{2}}=Plan, {{3}}=Amount, {{4}}=Start Date, {{5}}=End Date
    // (Previously Amount and Plan were SWAPPED causing wrong values in delivered messages)
    const bodyParams = [
        { type: 'text', text: String(user.name || 'Member') },
        { type: 'text', text: String(paymentData.planName || 'Plan') },
        { type: 'text', text: String(paymentData.amount || '0').replace(/[^0-9.]/g, '') },
        { type: 'text', text: String(paymentData.startDate || '') },
        { type: 'text', text: String(paymentData.endDate || '') }
    ];

    console.log(`[WHATSAPP] sendPaymentConfirmedMessage: sending payment_receipt_template_fallback to ${user.phone} | plan=${paymentData.planName} amount=${paymentData.amount}`);
    return await sendWhatsAppTemplate(user.phone, 'payment_receipt_template_fallback', [
        { type: 'body', parameters: bodyParams }
    ]);
};

/**
 * payment_receipt_template  (bullet-style receipt — preferred for all confirmed payments)
 * Tries payment_receipt_template first. If it’s still "in review" in Meta,
 * automatically falls back to payment_receipt_template_fallback so delivery NEVER fails.
 * Once Meta approves payment_receipt_template, the better format is used automatically.
 *
 * Correct param order: {{1}}=name, {{2}}=planName, {{3}}=amount, {{4}}=startDate, {{5}}=endDate
 */
exports.sendPaymentReceiptMessage = async (user, paymentData) => {
    if (!user || !user.phone) {
        console.warn('[WHATSAPP] sendPaymentReceiptMessage: no user or phone, skipping.');
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendPaymentReceiptMessage: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    const bodyParams = [
        { type: 'text', text: String(user.name || 'Member') },
        { type: 'text', text: String(paymentData.planName || 'Plan') },
        { type: 'text', text: String(paymentData.amount || '0').replace(/[^0-9.]/g, '') },
        { type: 'text', text: String(paymentData.startDate || '') },
        { type: 'text', text: String(paymentData.endDate || '') }
    ];
    const components = [{ type: 'body', parameters: bodyParams }];

    console.log(`[WHATSAPP] sendPaymentReceiptMessage: trying payment_receipt_template (with auto-fallback) for ${user.phone}`);
    // sendWithFallback tries the primary template first.
    // If Meta returns code 132001/132000 (in review), it retries with the fallback — zero message loss.
    return await sendWithFallback(
        user.phone,
        'payment_receipt_template',          // preferred — bullet-style (currently in review)
        'payment_receipt_template_fallback', // fallback  — always active
        components
    );
};

/**
 * upi_payment_pending_template
 * Sent to user when they choose UPI payment.
 * Header: location, Body: {{1}}=name, {{2}}=transactionId
 */
exports.sendUpiPaymentPendingUser = async ({ userName, email, planName, planPrice, transactionId }) => {
    if (!email) return null;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) {
        console.warn(`[WHATSAPP] sendUpiPaymentPendingUser: no user/phone for ${email}`);
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendUpiPaymentPendingUser: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    return await sendWhatsAppTemplate(user.phone, 'upi_payment_pending_template', [
        {
            type: 'header',
            parameters: [{
                type: 'location',
                location: {
                    latitude: '16.6913',
                    longitude: '74.2449',
                    name: 'Tara Fitness Centre',
                    address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
                }
            }]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(userName || 'Member') },
                { type: 'text', text: String(transactionId || 'N/A') }
            ]
        }
    ]);
};

// ─────────────────────────────────────────────────────────────────
// MEMBERSHIP / ACCOUNT TEMPLATES
// ─────────────────────────────────────────────────────────────────

const GYM_LOCATION = {
    type: 'location',
    location: {
        latitude: '16.6913',
        longitude: '74.2449',
        name: 'Tara Fitness Centre',
        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
    }
};

/**
 * welcome_message_template
 * Header: location, Body: {{1}}=name
 */
exports.sendWelcomeMessage = async (user) => {
    if (!user || !user.phone) {
        console.warn('[WHATSAPP] sendWelcomeMessage: no user or phone, skipping.');
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendWelcomeMessage: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    return await sendWhatsAppTemplate(user.phone, 'welcome_message_template', [
        { type: 'header', parameters: [GYM_LOCATION] },
        { type: 'body', parameters: [{ type: 'text', text: String(user.name || 'Member') }] }
    ]);
};

/**
 * membership_expiry_reminder_template
 * Header: location, Body: {{1}}=name, {{2}}=plan, {{3}}=daysLeft
 */
exports.sendExpiryReminder = async ({ name, email, planName, daysLeft }) => {
    if (!email) return null;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) {
        console.warn(`[WHATSAPP] sendExpiryReminder: no user/phone for ${email}`);
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendExpiryReminder: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    return await sendWhatsAppTemplate(user.phone, 'membership_expiry_reminder_template', [
        { type: 'header', parameters: [GYM_LOCATION] },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'Member') },
                { type: 'text', text: String(planName || 'Plan') },
                { type: 'text', text: String(daysLeft || '0') }
            ]
        }
    ]);
};

/**
 * membership_overdue_reminder_template
 * Header: location, Body: {{1}}=name, {{2}}=plan
 */
exports.sendOverdueReminder = async ({ name, email, planName }) => {
    if (!email) return null;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) {
        console.warn(`[WHATSAPP] sendOverdueReminder: no user/phone for ${email}`);
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendOverdueReminder: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    return await sendWhatsAppTemplate(user.phone, 'membership_overdue_reminder_template', [
        { type: 'header', parameters: [GYM_LOCATION] },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'Member') },
                { type: 'text', text: String(planName || 'Plan') }
            ]
        }
    ]);
};

/**
 * membership_expired_template
 * Header: location, Body: {{1}}=name, {{2}}=plan
 */
exports.sendExpiredAlert = async ({ name, email, planName }) => {
    if (!email) return null;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) {
        console.warn(`[WHATSAPP] sendExpiredAlert: no user/phone for ${email}`);
        return null;
    }

    // Role check: Only send to role 'user'
    if (user.role && user.role !== 'user') {
        console.log(`[WHATSAPP] Skipping sendExpiredAlert: user ${user.email || ''} has role "${user.role}"`);
        return null;
    }

    return await sendWhatsAppTemplate(user.phone, 'membership_expired_template', [
        { type: 'header', parameters: [GYM_LOCATION] },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'Member') },
                { type: 'text', text: String(planName || 'Plan') }
            ]
        }
    ]);
};

// Startup config validator (see index.js) — fail loud if credentials are missing.
exports.validateWhatsAppConfig = validateWhatsAppConfig;
