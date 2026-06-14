const User = require('../models/User');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

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
        console.error(`[WHATSAPP] ❌ Meta API error for "${templateName}": ${data.error.message} (fbtrace: ${data.error.fbtrace_id})`);
        const err = new Error(`WhatsApp API Error: ${data.error.message}`);
        err.metaError = data.error;
        throw err;
    }

    const messageId = data.messages && data.messages[0] ? data.messages[0].id : null;
    console.log(`[WHATSAPP] ✅ "${templateName}" sent to ${formattedNumber} — wamid: ${messageId}`);
    return { success: true, messageId, formattedNumber };
}

// ─────────────────────────────────────────────────────────────────
// PAYMENT TEMPLATES
// ─────────────────────────────────────────────────────────────────

/**
 * cash_payment_request_template
 * Sent to user when they choose "Cash on Bench" — asks them to bring cash.
 * Header: document (PDF), Body: {{1}}=name, {{2}}=planName, {{3}}=amount
 */
exports.sendPaymentPendingMessage = async (user, paymentData, documentUrl) => {
    if (!user || !user.phone) {
        console.warn('[WHATSAPP] sendPaymentPendingMessage: no user or phone, skipping.');
        return null;
    }

    // If no PDF available, skip the document header and use the fallback text-only variant
    // cash_payment_request_template has a required document header; use fallback if no URL
    if (!documentUrl) {
        console.warn('[WHATSAPP] sendPaymentPendingMessage: no documentUrl — sending text-only body only.');
        return await sendWhatsAppTemplate(user.phone, 'cash_payment_request_template', [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: String(user.name || 'Member') },
                    { type: 'text', text: String(paymentData.planName || 'Plan') },
                    { type: 'text', text: String(paymentData.amount || '0').replace(/[^0-9.]/g, '') }
                ]
            }
        ]);
    }

    return await sendWhatsAppTemplate(user.phone, 'cash_payment_request_template', [
        {
            type: 'header',
            parameters: [
                {
                    type: 'document',
                    document: {
                        link: documentUrl,
                        filename: `Payment_Pending_${String(user.name).replace(/\s+/g, '_')}.pdf`
                    }
                }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(user.name || 'Member') },
                { type: 'text', text: String(paymentData.planName || 'Plan') },
                { type: 'text', text: String(paymentData.amount || '0').replace(/[^0-9.]/g, '') }
            ]
        }
    ]);
};

/**
 * payment_receipt_template (with PDF) or payment_receipt_template_fallback (no PDF)
 * Sent after admin confirms a payment.
 * Body: {{1}}=name, {{2}}=plan, {{3}}=amount, {{4}}=startDate, {{5}}=endDate
 */
exports.sendPaymentConfirmedMessage = async (user, paymentData, documentUrl) => {
    if (!user || !user.phone) {
        console.warn('[WHATSAPP] sendPaymentConfirmedMessage: no user or phone, skipping.');
        return null;
    }

    const bodyParams = [
        { type: 'text', text: String(user.name || 'Member') },
        { type: 'text', text: String(paymentData.planName || 'Plan') },
        { type: 'text', text: String(paymentData.amount || '0').replace(/[^0-9.]/g, '') },
        { type: 'text', text: String(paymentData.startDate || '') },
        { type: 'text', text: String(paymentData.endDate || '') }
    ];

    if (documentUrl) {
        return await sendWhatsAppTemplate(user.phone, 'payment_receipt_template', [
            {
                type: 'header',
                parameters: [
                    {
                        type: 'document',
                        document: {
                            link: documentUrl,
                            filename: `Receipt_${String(user.name).replace(/\s+/g, '_')}.pdf`
                        }
                    }
                ]
            },
            { type: 'body', parameters: bodyParams }
        ]);
    } else {
        return await sendWhatsAppTemplate(user.phone, 'payment_receipt_template_fallback', [
            { type: 'body', parameters: bodyParams }
        ]);
    }
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
