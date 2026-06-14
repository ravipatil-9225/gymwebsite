const notificationEmitter = require('../events/notificationEmitter');
const whatsappService = require('./whatsappService');
const NotificationLog = require('../models/NotificationLog');

const RETRY_DELAYS_MS = [0, 5000, 15000, 30000]; // 0s, 5s, 15s, 30s

// Helper for waiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class NotificationEngine {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        // Payment Confirmed (Receipt)
        notificationEmitter.on('payment_confirmed', async (payload) => {
            const { user, paymentData, documentUrl } = payload;
            const logEntry = await this.createLogEntry(user, paymentData, 'payment_receipt_template', 'payment_confirmed');
            
            this.executeWithRetry(logEntry._id, async () => {
                const result = await whatsappService.sendPaymentConfirmedMessage(user, paymentData, documentUrl);
                return result; // return { success, messageId }
            });
        });

        // Cash Payment Requested
        notificationEmitter.on('cash_payment_request', async (payload) => {
            const { user, paymentData, documentUrl } = payload;
            const logEntry = await this.createLogEntry(user, paymentData, 'cash_payment_request_template', 'cash_payment_request');
            
            this.executeWithRetry(logEntry._id, async () => {
                return await whatsappService.sendPaymentPendingMessage(user, paymentData, documentUrl);
            });
        });

        // UPI Payment Pending
        notificationEmitter.on('upi_payment_pending', async (payload) => {
            const { user, paymentData } = payload;
            const logEntry = await this.createLogEntry(user, paymentData, 'upi_payment_pending_template', 'upi_payment_pending');
            
            this.executeWithRetry(logEntry._id, async () => {
                return await whatsappService.sendUpiPaymentPendingUser(paymentData); // paymentData has the required format
            });
        });

        // User Registered (Welcome)
        notificationEmitter.on('user_registered', async (payload) => {
            const { user } = payload;
            const logEntry = await this.createLogEntry(user, {}, 'welcome_message_template', 'user_registered');
            
            this.executeWithRetry(logEntry._id, async () => {
                return await whatsappService.sendWelcomeMessage(user);
            });
        });

        // Membership Expiry Reminder
        notificationEmitter.on('membership_expiry_reminder', async (payload) => {
            const { user, reminderData } = payload;
            const logEntry = await this.createLogEntry(user, reminderData, 'membership_expiry_reminder_template', 'membership_expiry_reminder');
            
            this.executeWithRetry(logEntry._id, async () => {
                return await whatsappService.sendExpiryReminder(reminderData);
            });
        });

        // Membership Overdue Reminder
        notificationEmitter.on('membership_overdue_reminder', async (payload) => {
            const { user, reminderData } = payload;
            const logEntry = await this.createLogEntry(user, reminderData, 'membership_overdue_reminder_template', 'membership_overdue_reminder');
            
            this.executeWithRetry(logEntry._id, async () => {
                return await whatsappService.sendOverdueReminder(reminderData);
            });
        });

        // Membership Expired
        notificationEmitter.on('membership_expired', async (payload) => {
            const { user, reminderData } = payload;
            const logEntry = await this.createLogEntry(user, reminderData, 'membership_expired_template', 'membership_expired');
            
            this.executeWithRetry(logEntry._id, async () => {
                return await whatsappService.sendExpiredAlert(reminderData);
            });
        });
    }

    async createLogEntry(user, payloadData, templateName, eventType) {
        try {
            const log = new NotificationLog({
                userId: user._id,
                phone: user.phone || 'unknown',
                templateName,
                eventType,
                payload: payloadData,
                status: 'pending'
            });
            await log.save();
            return log;
        } catch (error) {
            console.error('Failed to create NotificationLog entry:', error);
            return { _id: null }; // Return dummy if failed so executeWithRetry can still proceed but won't update
        }
    }

    async executeWithRetry(logId, fn) {
        for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
            if (attempt > 0) {
                await delay(RETRY_DELAYS_MS[attempt]);
            }

            try {
                if (logId) {
                    await NotificationLog.findByIdAndUpdate(logId, {
                        retryCount: attempt,
                        lastRetryAt: new Date()
                    });
                }

                // fn should be the whatsappService call which now throws if Meta API errors out
                const result = await fn();
                
                // If we reach here, it was successful
                if (logId && result && result.messageId) {
                    await NotificationLog.findByIdAndUpdate(logId, {
                        status: 'sent',
                        messageId: result.messageId
                    });
                }
                
                return; // Exit retry loop on success

            } catch (error) {
                console.error(`[NOTIFICATION ENGINE] Attempt ${attempt + 1} failed for logId ${logId}. Error: ${error.message}`);
                
                if (logId) {
                    const updateData = {
                        metaError: error.metaError || error.message,
                        fbtraceId: error.fbtraceId || null
                    };

                    if (attempt === RETRY_DELAYS_MS.length - 1) {
                        updateData.status = 'permanent_failure';
                    } else {
                        updateData.status = 'failed';
                    }

                    await NotificationLog.findByIdAndUpdate(logId, updateData);
                }
            }
        }
    }
}

// Instantiate to bind listeners
const notificationEngine = new NotificationEngine();

module.exports = notificationEngine;
