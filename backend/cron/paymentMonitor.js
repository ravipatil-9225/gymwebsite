const cron = require('node-cron');
const Payment = require('../models/Payment');
const emailService = require('../services/emailService');

const startPaymentMonitorCron = () => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[CRON] Running overdue payment monitor...');
            const now = new Date();

            // Find all pending pay_later payments
            const pendingPayments = await Payment.find({
                paymentMethod: 'pay_later',
                verificationStatus: 'pending'
            });

            for (const payment of pendingPayments) {
                if (!payment.expiryDate) continue;

                if (now > payment.expiryDate) {
                    // Mark as overdue
                    payment.verificationStatus = 'overdue';
                    await payment.save();
                    console.log(`[CRON] Payment ${payment._id} marked as overdue.`);
                    
                    // Optional: send overdue reminder via email/WhatsApp
                    // emailService.sendOverdueReminder(payment).catch(console.error);
                } else {
                    // Optional: Check if expiry is in exactly 2 days
                    const daysLeft = Math.ceil((payment.expiryDate - now) / (1000 * 60 * 60 * 24));
                    if (daysLeft === 2) {
                        // emailService.sendExpiryReminder(payment).catch(console.error);
                        console.log(`[CRON] Payment ${payment._id} is expiring in 2 days.`);
                    }
                }
            }
        } catch (error) {
            console.error('[CRON] Error in payment monitor cron:', error);
        }
    });
};

module.exports = { startPaymentMonitorCron };
