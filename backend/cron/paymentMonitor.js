const cron = require('node-cron');
const Payment = require('../models/Payment');
const emailService = require('../services/emailService');
const notificationEmitter = require('../events/notificationEmitter');
const User = require('../models/User');
const { daysUntilIST, sleep } = require('../utils/dateUtils');

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
                // Per-record isolation: one bad record must never abort the whole batch.
                try {
                    if (!payment.expiryDate) continue;

                    if (now > payment.expiryDate) {
                        // Mark as overdue (status flip is itself a dedup — it leaves the 'pending' set)
                        payment.verificationStatus = 'overdue';
                        if (!payment.overdueReminderSent) {
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
                            payment.overdueReminderSent = true;
                        }
                        await payment.save();
                        console.log(`[CRON] Payment ${payment._id} marked as overdue.`);
                    } else {
                        // Expiring soon: send once when 1–2 days out (IST day math), guarded by a
                        // dedup flag so a repeated run won't re-send and a skipped day won't miss it.
                        const daysLeft = daysUntilIST(payment.expiryDate, now);
                        if (daysLeft <= 2 && daysLeft > 0 && !payment.expiryReminder2Sent) {
                            const userDoc = await User.findOne({ email: new RegExp(`^${payment.email}$`, 'i') });
                            if (userDoc) {
                                notificationEmitter.emit('membership_expiry_reminder', {
                                    user: userDoc,
                                    reminderData: {
                                        name: payment.userName,
                                        email: payment.email,
                                        planName: payment.planName,
                                        daysLeft
                                    }
                                });
                            }
                            payment.expiryReminder2Sent = true;
                            await payment.save();
                            console.log(`[CRON] Payment ${payment._id} expiring in ${daysLeft} day(s). WhatsApp sent.`);
                        }
                    }
                } catch (recErr) {
                    console.error(`[CRON] Skipping payment ${payment?._id} due to error:`, recErr.message);
                }

                // Gentle spacing so a big same-day batch never bursts past Meta's rate limit.
                await sleep(300);
            }
    } catch (error) {
        console.error('[CRON] Error in payment monitor cron:', error);
    }
};

const startPaymentMonitorCron = () => {
    cron.schedule('0 9 * * *', runPaymentMonitorLogic, {
        timezone: 'Asia/Kolkata'
    });

    console.log('📅 Overdue payment monitor cron job registered (daily at 9:00 AM IST).');
};

module.exports = { startPaymentMonitorCron, runPaymentMonitorLogic };
