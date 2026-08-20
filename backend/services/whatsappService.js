const User = require('../models/User');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

// Meta error codes that mean the template is not yet usable
const TEMPLATE_NOT_READY_CODES = [
    132001, // Template name does not exist (still in review or not created)
    132000, // Template is not approved yet
    132005, // Template rejected
];

/**
 * Core helper — sends a WhatsApp template and returns the result.
 * Throws on error so callers can handle it.
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

    console.log(`[WHATSAPP] Sending "${templateName}" to ${formattedNumber}...`);

    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
        console.error(`[WHATSAPP] ❌ Meta API error for "${templateName}": ${data.error.message} (code: ${data.error.code}, fbtrace: ${data.error.fbtrace_id})`);
        const err = new Error(`WhatsApp API Error: ${data.error.message}`);
        err.metaError = data.error;
        err.metaErrorCode = data.error.code;
        throw err;
    }

    const messageId = data.messages && data.messages[0] ? data.messages[0].id : null;
    console.log(`[WHATSAPP] ✅ "${templateName}" sent to ${formattedNumber} — wamid: ${messageId}`);
    return { success: true, messageId, formattedNumber, templateUsed: templateName };
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
