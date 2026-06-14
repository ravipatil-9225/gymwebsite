const cron = require('node-cron');
const Payment = require('../models/Payment');
const emailService = require('../services/emailService');
const notificationEmitter = require('../events/notificationEmitter');
const User = require('../models/User');

const runPaymentMonitorLogic = async () => {
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
                    
                    // Trigger overdue reminder via WhatsApp
                    const userDoc = await User.findOne({ email: new RegExp(`^${payment.email}$`, 'i') });
                    if (userDoc) {
                        notificationEmitter.emit('membership_overdue_reminder', {
                            user: userDoc,
                            reminderData: {
                                name: payment.userName,
                                email: payment.email,
                                planName: payment.planName
                            }
                        });
                    }
                } else {
                    // Check if expiry is in exactly 2 days
                    const daysLeft = Math.ceil((payment.expiryDate - now) / (1000 * 60 * 60 * 24));
                    if (daysLeft === 2) {
                        const userDoc = await User.findOne({ email: new RegExp(`^${payment.email}$`, 'i') });
                        if (userDoc) {
                            notificationEmitter.emit('membership_expiry_reminder', {
                                user: userDoc,
                                reminderData: {
                                    name: payment.userName,
                                    email: payment.email,
                                    planName: payment.planName,
                                    daysLeft: 2
                                }
                            });
                        }
                        console.log(`[CRON] Payment ${payment._id} is expiring in 2 days. WhatsApp sent.`);
                    }
                }
            }
    } catch (error) {
        console.error('[CRON] Error in payment monitor cron:', error);
    }
};

const startPaymentMonitorCron = () => {
    cron.schedule('0 0 * * *', runPaymentMonitorLogic);
};

module.exports = { startPaymentMonitorCron, runPaymentMonitorLogic };
