const User = require('../models/User');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

/**
 * Helper to send a pre-approved template message via WhatsApp Cloud API.
 * 
 * Note: To send messages outside of a 24-hour window, WhatsApp requires pre-approved
 * message templates. You must create these in your Facebook Business Manager.
 * 
 * @param {string} to - Destination phone number with country code (e.g., "919876543210")
 * @param {string} templateName - The name of the approved template in Meta Manager
 * @param {Array} components - The dynamic parameters (body/header variables)
 */
async function sendWhatsAppTemplate(to, templateName, components = []) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.warn('⚠️ WhatsApp API credentials missing. Skipping message.');
        return;
    }

    // Format the number: remove +, space, dashes
    let formattedNumber = to.replace(/\D/g, '');
    
    // Strip leading zero for Indian numbers if someone typed 09876543210
    if (formattedNumber.startsWith('0') && formattedNumber.length === 11) {
        formattedNumber = formattedNumber.substring(1);
    }
    
    // Auto-prefix Indian country code '91' if missing (assume 10 digits without it)
    if (formattedNumber.length === 10) {
        formattedNumber = '91' + formattedNumber;
    }

    const payload = {
        messaging_product: 'whatsapp',
        to: formattedNumber,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: 'en' // Matches 'en' in testWhatsapp.js
            },
            components: components
        }
    };

    console.log(`\n[WHATSAPP] Sending ${templateName} to ${formattedNumber}...`);

    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
        const errMsg = data.error.message || 'Unknown Meta API Error';
        const fbtraceId = data.error.fbtrace_id || 'unknown';
        const errorObj = new Error(`WhatsApp API Error: ${errMsg}`);
        errorObj.metaError = data.error;
        errorObj.fbtraceId = fbtraceId;
        throw errorObj;
    }
    
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${JSON.stringify(data)}`);
    }

    // data.messages[0].id contains the wamid
    const messageId = data.messages && data.messages.length > 0 ? data.messages[0].id : null;
    console.log(`[WHATSAPP] ✅ ${templateName} sent successfully to ${formattedNumber} (Message ID: ${messageId})`);
    
    return {
        success: true,
        messageId: messageId,
        formattedNumber: formattedNumber,
        payload: payload
    };
}

// ─────────────────────────────────────────────────────────────────
// TRANSACTIONS / RECEIPTS LOGIC
// ─────────────────────────────────────────────────────────────────

// Fallback dummy PDF if dynamic generation fails
const FALLBACK_DOC_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const { generateAndUploadReceipt } = require('./generateReceiptPDF');

exports.sendPaymentPendingMessage = async (user, paymentData, documentUrl) => {
    if (!user || !user.phone) return;

    const components = [
        {
            type: 'header',
            parameters: [
                { type: 'document', document: { link: documentUrl, filename: `Payment_Pending_${user.name.replace(/\s+/g,'_')}.pdf` } }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(user.name) },
                { type: 'text', text: String(paymentData.planName) },
                { type: 'text', text: String(paymentData.amount).replace(/[^0-9.]/g, '') }
            ]
        }
    ];

    return await sendWhatsAppTemplate(user.phone, 'cash_payment_request_template', components);
};

exports.sendUpiPaymentPendingUser = async ({ userName, email, planName, planPrice, transactionId }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    // Template: upi_payment_pending_template | Header: LOCATION | Body: 2 vars (name, txnId)
    return await sendWhatsAppTemplate(user.phone, 'upi_payment_pending_template', [
        {
            type: 'header',
            parameters: [
                {
                    type: 'location',
                    location: {
                        latitude: '16.6913',
                        longitude: '74.2449',
                        name: 'Tara Fitness Centre',
                        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
                    }
                }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(userName || 'User') },
                { type: 'text', text: String(transactionId || 'N/A') }
            ]
        }
    ]);
};

exports.sendPaymentConfirmedMessage = async (user, paymentData, documentUrl) => {
    if (!user || !user.phone) return;

    const components = [
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(user.name) },
                { type: 'text', text: String(paymentData.planName) },
                { type: 'text', text: String(paymentData.amount).replace(/[^0-9.]/g, '') },
                { type: 'text', text: String(paymentData.startDate) },
                { type: 'text', text: String(paymentData.endDate) }
            ]
        }
    ];

    let templateName = 'payment_receipt_template';

    if (documentUrl) {
        components.unshift({
            type: 'header',
            parameters: [
                { type: 'document', document: { link: documentUrl, filename: `Receipt_${user.name.replace(/\s+/g,'_')}.pdf` } }
            ]
        });
    } else {
        templateName = 'payment_receipt_template_fallback';
    }

    return await sendWhatsAppTemplate(user.phone, templateName, components);
};
exports.sendWelcomeMessage = async (user) => {
    if (!user || !user.phone) return;

    return await sendWhatsAppTemplate(user.phone, 'welcome_message_template', [
        {
            type: 'header',
            parameters: [
                {
                    type: 'location',
                    location: {
                        latitude: '16.6913',
                        longitude: '74.2449',
                        name: 'Tara Fitness Centre',
                        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
                    }
                }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(user.name || 'User') }
            ]
        }
    ]);
};


exports.sendExpiryReminder = async ({ name, email, planName, daysLeft }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    // Template: membership_expiry_reminder_template | Header: LOCATION | Body: 3 vars (name, plan, days)
    return await sendWhatsAppTemplate(user.phone, 'membership_expiry_reminder_template', [
        {
            type: 'header',
            parameters: [
                {
                    type: 'location',
                    location: {
                        latitude: '16.6913',
                        longitude: '74.2449',
                        name: 'Tara Fitness Centre',
                        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
                    }
                }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'User') },
                { type: 'text', text: String(planName || 'Plan') },
                { type: 'text', text: String(daysLeft || '0') }
            ]
        }
    ]);
};

exports.sendOverdueReminder = async ({ name, email, planName }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    // Template: membership_overdue_reminder_template | Header: LOCATION | Body: 2 vars (name, plan)
    return await sendWhatsAppTemplate(user.phone, 'membership_overdue_reminder_template', [
        {
            type: 'header',
            parameters: [
                {
                    type: 'location',
                    location: {
                        latitude: '16.6913',
                        longitude: '74.2449',
                        name: 'Tara Fitness Centre',
                        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
                    }
                }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'User') },
                { type: 'text', text: String(planName || 'Plan') }
            ]
        }
    ]);
};

exports.sendExpiredAlert = async ({ name, email, planName }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    return await sendWhatsAppTemplate(user.phone, 'membership_expired_template', [
        {
            type: 'header',
            parameters: [
                {
                    type: 'location',
                    location: {
                        latitude: '16.6913',
                        longitude: '74.2449',
                        name: 'Tara Fitness Centre',
                        address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur'
                    }
                }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'User') },
                { type: 'text', text: String(planName || 'Plan') }
            ]
        }
    ]);
};


