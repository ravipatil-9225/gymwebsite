/**
 * notificationEngine.js
 * 
 * Binds to notificationEmitter events and calls whatsappService directly.
 * Each event handler is logged into NotificationLog (pending -> sent/failed/permanent_failure).
 * Errors are caught, saved in DB, and logged — the server never crashes.
 * 
 * Also exports executeWithRetry() for the admin retry endpoint.
 */

const notificationEmitter = require('../events/notificationEmitter');
const whatsappService = require('./whatsappService');
const NotificationLog = require('../models/NotificationLog');

// ── logAndSendNotification ──────────────────────────────────────────────────
// Helper to log attempts, send, and update log statuses
async function logAndSendNotification({ user, eventType, templateName, payload, sendFn }) {
    let logDoc = null;
    try {
        const phone = user?.phone || payload?.phone || '';
        if (!phone) {
            console.warn(`[ENGINE] Cannot log/send "${templateName}" for event "${eventType}": phone is empty.`);
            return;
        }

        // 1. Create a pending log entry
        logDoc = await NotificationLog.create({
            userId: user?._id || null,
            phone,
            templateName,
            eventType,
            payload,
            status: 'pending'
        });

        // 2. Send the message
        const result = await sendFn();

        if (result && result.success) {
            // 3. Update log to sent
            logDoc.status = 'sent';
            logDoc.messageId = result.messageId;
            await logDoc.save();
            console.log(`[ENGINE] ✅ Successfully sent & logged "${templateName}" to ${phone} (logId: ${logDoc._id})`);
        } else {
            // Skipped (e.g. role check or other business rules return null)
            logDoc.status = 'permanent_failure';
            logDoc.metaError = { message: 'Skipped (e.g. user role was admin)' };
            await logDoc.save();
            console.log(`[ENGINE] ⏭️ Skipped "${templateName}" for ${phone} (marked permanent_failure, logId: ${logDoc._id})`);
        }
    } catch (err) {
        console.error(`[ENGINE] ❌ Failed sending "${templateName}" to ${user?.email || 'User'}:`, err.message);
        if (logDoc) {
            logDoc.status = 'failed';
            logDoc.metaError = err.metaError || { message: err.message };
            await logDoc.save();
        } else {
            // Fallback if log doc creation failed
            try {
                await NotificationLog.create({
                    userId: user?._id || null,
                    phone: user?.phone || payload?.phone || 'unknown',
                    templateName,
                    eventType,
                    payload,
                    status: 'failed',
                    metaError: err.metaError || { message: err.message }
                });
            } catch (dbErr) {
                console.error('[ENGINE] Double failure: could not save failed log entry:', dbErr.message);
            }
        }
    }
}

// ── executeWithRetry ────────────────────────────────────────────────────────
// Wraps a single WhatsApp service call. Runs async in background.
// Called by adminRoutes retry endpoint.
async function executeWithRetry(logId, fn) {
    try {
        console.log(`[ENGINE] executeWithRetry — attempting logId: ${logId}`);
        const result = await fn();
        
        await NotificationLog.findByIdAndUpdate(logId, {
            status: 'sent',
            messageId: result?.messageId || undefined,
            $inc: { retryCount: 1 },
            lastRetryAt: new Date()
        });
        console.log(`[ENGINE] executeWithRetry — success for logId: ${logId}`);
    } catch (err) {
        console.error(`[ENGINE] executeWithRetry — failed for logId: ${logId}:`, err.message);
        await NotificationLog.findByIdAndUpdate(logId, {
            status: 'failed',
            metaError: err.metaError || { message: err.message },
            $inc: { retryCount: 1 },
            lastRetryAt: new Date()
        });
    }
}

function setupListeners() {

    // ── Payment receipt after admin verifies (cash OR upi) ──────────────
    notificationEmitter.on('payment_confirmed', async ({ user, paymentData, documentUrl }) => {
        console.log(`[ENGINE] payment_confirmed → sending receipt to ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'payment_confirmed',
            templateName: 'payment_receipt_template_fallback',
            payload: { ...paymentData, documentUrl },
            sendFn: async () => await whatsappService.sendPaymentConfirmedMessage(user, paymentData, documentUrl)
        });
    });

    // ── Cash on Bench request sent to user ──────────────────────────────
    notificationEmitter.on('cash_payment_request', async ({ user, paymentData, documentUrl }) => {
        console.log(`[ENGINE] cash_payment_request → sending pending notice to ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'cash_payment_request',
            templateName: 'cash_payment_request_template',
            payload: { ...paymentData, documentUrl },
            sendFn: async () => await whatsappService.sendPaymentPendingMessage(user, paymentData, documentUrl)
        });
    });

    // ── UPI payment pending ──────────────────────────────────────────────
    notificationEmitter.on('upi_payment_pending', async ({ user, paymentData }) => {
        console.log(`[ENGINE] upi_payment_pending → sending UPI instructions to ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'upi_payment_pending',
            templateName: 'upi_payment_pending_template',
            payload: paymentData,
            sendFn: async () => await whatsappService.sendUpiPaymentPendingUser(paymentData)
        });
    });

    // ── New member welcome ───────────────────────────────────────────────
    notificationEmitter.on('user_registered', async ({ user }) => {
        console.log(`[ENGINE] user_registered → sending welcome to ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'user_registered',
            templateName: 'welcome_message_template',
            payload: {},
            sendFn: async () => await whatsappService.sendWelcomeMessage(user)
        });
    });

    // ── Expiry reminder (3-day / 7-day) ─────────────────────────────────
    notificationEmitter.on('membership_expiry_reminder', async ({ user, reminderData }) => {
        console.log(`[ENGINE] membership_expiry_reminder → reminding ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'membership_expiry_reminder',
            templateName: 'membership_expiry_reminder_template',
            payload: reminderData,
            sendFn: async () => await whatsappService.sendExpiryReminder(reminderData)
        });
    });

    // ── Pay-Later overdue ────────────────────────────────────────────────
    notificationEmitter.on('membership_overdue_reminder', async ({ user, reminderData }) => {
        console.log(`[ENGINE] membership_overdue_reminder → nudging ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'membership_overdue_reminder',
            templateName: 'membership_overdue_reminder_template',
            payload: reminderData,
            sendFn: async () => await whatsappService.sendOverdueReminder(reminderData)
        });
    });

    // ── Membership expired ───────────────────────────────────────────────
    notificationEmitter.on('membership_expired', async ({ user, reminderData }) => {
        console.log(`[ENGINE] membership_expired → alerting ${user.email}`);
        await logAndSendNotification({
            user,
            eventType: 'membership_expired',
            templateName: 'membership_expired_template',
            payload: reminderData,
            sendFn: async () => await whatsappService.sendExpiredAlert(reminderData)
        });
    });

    console.log('[ENGINE] ✅ WhatsApp notification listeners registered for all 7 event types.');
}

setupListeners();

module.exports = { executeWithRetry };
