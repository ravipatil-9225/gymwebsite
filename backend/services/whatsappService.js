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
        
        // Auto-prefix Indian country code '91' if missing (assume 10 digits without it)
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }

        const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: formattedNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'en' // Change to en_US or en_GB based on your template
                    },
                    components: components
                }
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error('❌ WhatsApp API Error:', data.error.message);
        } else {
            console.log(`✅ WhatsApp sent successfully to ${formattedNumber}`);
        }
    } catch (err) {
        console.error('WhatsApp Service Error:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
// TRANSACTIONS / RECEIPTS LOGIC
// ─────────────────────────────────────────────────────────────────

exports.sendCashPaymentPendingUser = async ({ userName, email, planName, planPrice }) => {
    // 1. Fetch user to get their phone number
    const user = await User.findOne({ email });
    if (!user || !user.phone) return;

    // Example Template Components
    // Suppose your template has variables like:
    // Hi {{1}}, your cash payment request for {{2}} (₹{{3}}) is recorded. Next steps: Visit reception...
    await sendWhatsAppTemplate(user.phone, 'cash_payment_request_template', [
        {
            type: 'body',
            parameters: [
                { type: 'text', text: userName },
                { type: 'text', text: planName },
                { type: 'text', text: String(planPrice) }
            ]
        }
    ]);
};

exports.sendUpiPaymentPendingUser = async ({ userName, email, planName, planPrice, transactionId }) => {
    const user = await User.findOne({ email });
    if (!user || !user.phone) return;

    await sendWhatsAppTemplate(user.phone, 'upi_payment_pending_template', [
        {
            type: 'body',
            parameters: [
                { type: 'text', text: userName },
                { type: 'text', text: transactionId } // Let them know this Txn is processing
            ]
        }
    ]);
};

exports.sendPaymentConfirmation = async ({ name, email, packageName, amountPaid, startDate, endDate }) => {
    const user = await User.findOne({ email });
    if (!user || !user.phone) return;

    const startLocal = new Date(startDate).toLocaleDateString('en-IN');
    const endLocal = new Date(endDate).toLocaleDateString('en-IN');

    // Receipt Template setup: 
    // Title/Header could be Payment Confirmed!
    // Body variables: 1=Name, 2=Package, 3=Amount, 4=StartDate, 5=EndDate
    await sendWhatsAppTemplate(user.phone, 'payment_receipt_template', [
        {
            type: 'body',
            parameters: [
                { type: 'text', text: name },
                { type: 'text', text: packageName },
                { type: 'text', text: String(amountPaid) },
                { type: 'text', text: startLocal },
                { type: 'text', text: endLocal }
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
                { type: 'text', text: user.name }
            ]
        }
    ]);
};


exports.sendExpiryReminder = async ({ name, email, planName, daysLeft }) => {
    const user = await User.findOne({ email });
    if (!user || !user.phone) return;

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
                { type: 'text', text: name },
                { type: 'text', text: planName },
                { type: 'text', text: String(daysLeft) }
            ]
        }
    ]);
};

exports.sendOverdueReminder = async ({ name, email, planName }) => {
    const user = await User.findOne({ email });
    if (!user || !user.phone) return;

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
                { type: 'text', text: name },
                { type: 'text', text: planName }
            ]
        }
    ]);
};

exports.sendExpiredAlert = async ({ name, email, planName }) => {
    const user = await User.findOne({ email });
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
                { type: 'text', text: name },
                { type: 'text', text: planName }
            ]
        }
    ]);
};


