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

    try {
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

        console.log("\n========== WHATSAPP DEBUG ==========");
        console.log("Template:", templateName);
        console.log("Phone:", formattedNumber);
        console.log("Payload:", JSON.stringify(payload, null, 2));
        console.log("Sending request...");
        console.log("====================================");

        const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        console.log("\n========== WHATSAPP RESPONSE ==========");
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
        console.log("=======================================\n");

        if (data.error) {
            console.error('❌ WhatsApp API Error for template', templateName, ':', data.error.message);
            if (data.error.error_data) {
                console.error('   Details:', JSON.stringify(data.error.error_data));
            }
        } else {
            console.log(`✅ WhatsApp ${templateName} sent successfully to ${formattedNumber}`);
        }
    } catch (err) {
        console.error("\n========== WHATSAPP FATAL ERROR ==========");
        console.error(err.message);
        console.error("==========================================\n");
    }
}

// ─────────────────────────────────────────────────────────────────
// TRANSACTIONS / RECEIPTS LOGIC
// ─────────────────────────────────────────────────────────────────

// Static branded PDF used as the document header for templates that require it.
// This is a simple one-page Tara Fitness branded PDF hosted on Cloudinary.
const BRANDED_DOC_URL = 'https://res.cloudinary.com/dn6nxrrot/image/upload/v1/tara_fitness_receipt.pdf';

exports.sendCashPaymentPendingUser = async ({ userName, email, planName, planPrice }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    // Template: cash_payment_request_template | Header: DOCUMENT | Body: 3 vars (name, plan, price)
    await sendWhatsAppTemplate(user.phone, 'cash_payment_request_template', [
        {
            type: 'header',
            parameters: [
                { type: 'document', document: { link: BRANDED_DOC_URL, filename: 'TaraFitness_Registration.pdf' } }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(userName || 'User') },
                { type: 'text', text: String(planName || 'Plan') },
                { type: 'text', text: String(planPrice || '0') }
            ]
        }
    ]);
};

exports.sendUpiPaymentPendingUser = async ({ userName, email, planName, planPrice, transactionId }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    // Template: upi_payment_pending_template | Header: LOCATION | Body: 2 vars (name, txnId)
    await sendWhatsAppTemplate(user.phone, 'upi_payment_pending_template', [
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

exports.sendPaymentConfirmation = async ({ name, email, packageName, amountPaid, startDate, endDate }) => {
    if (!email) return;
    const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user || !user.phone) return;

    const startLocal = startDate ? new Date(startDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const endLocal = endDate ? new Date(endDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    // Template: payment_receipt_template | Header: DOCUMENT | Body: 5 vars (name, pkg, amt, start, end)
    await sendWhatsAppTemplate(user.phone, 'payment_receipt_template', [
        {
            type: 'header',
            parameters: [
                { type: 'document', document: { link: BRANDED_DOC_URL, filename: `Receipt_${String(name || 'User').replace(/\s+/g, '_')}.pdf` } }
            ]
        },
        {
            type: 'body',
            parameters: [
                { type: 'text', text: String(name || 'User') },
                { type: 'text', text: String(packageName || 'Plan') },
                { type: 'text', text: String(amountPaid || '0') },
                { type: 'text', text: String(startLocal) },
                { type: 'text', text: String(endLocal) }
            ]
        }
    ]);
};

exports.sendWelcomeMessage = async (user) => {
    if (!user || !user.phone) return;

    await sendWhatsAppTemplate(user.phone, 'welcome_message_template', [
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
    await sendWhatsAppTemplate(user.phone, 'membership_expiry_reminder_template', [
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
    await sendWhatsAppTemplate(user.phone, 'membership_overdue_reminder_template', [
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

    await sendWhatsAppTemplate(user.phone, 'membership_expired_template', [
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


