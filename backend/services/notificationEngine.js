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
const User = require('../models/User');

// Retry sweeper tunables (override via env if ever needed)
const MAX_NOTIFICATION_RETRIES = Number(process.env.WHATSAPP_MAX_LOG_RETRIES) || 5;
const RETRY_BACKOFF_MINUTES = [2, 10, 30, 120, 360]; // schedule for each successive retry

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

        // Classify: auth failures and non-retryable Meta errors are PERMANENT (retrying
        // won't help until a human acts). Everything else is retryable — the sweeper
        // (retryFailedNotifications) will pick it up on a backoff schedule.
        const retryable = err.isRetryable === true && !err.isAuthError;
        const status = retryable ? 'failed' : 'permanent_failure';
        const nextRetryAt = retryable ? new Date(Date.now() + RETRY_BACKOFF_MINUTES[0] * 60000) : undefined;
        if (err.isAuthError) {
            console.error('[ENGINE] 🔑 Auth failure — marking permanent_failure (needs a fresh WHATSAPP_TOKEN, not a retry).');
        }

        if (logDoc) {
            logDoc.status = status;
            logDoc.metaError = err.metaError ? { ...err.metaError, source: 'send' } : { message: err.message, source: 'send' };
            if (nextRetryAt) logDoc.nextRetryAt = nextRetryAt;
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
                    status,
                    nextRetryAt,
                    metaError: err.metaError ? { ...err.metaError, source: 'send' } : { message: err.message, source: 'send' }
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

// ── resendFromLog ─────────────────────────────────────────────────────────────
// Rebuilds the correct WhatsApp send from a stored NotificationLog so the sweeper
// can re-attempt a failed message. Refetches the User (by userId) when the sender
// needs a user object, so name/phone/role stay correct.
async function buildSendFnForLog(logDoc) {
    const payload = logDoc.payload || {};
    let user = null;
    if (logDoc.userId) {
        try { user = await User.findById(logDoc.userId); } catch (_) { /* ignore */ }
    }
    // Minimal fallback user (enough for the phone-based senders) if the doc is gone.
    if (!user) {
        user = { _id: logDoc.userId || null, phone: logDoc.phone, name: payload.name || payload.userName || 'Member', email: payload.email, role: 'user' };
    }

    switch (logDoc.eventType) {
        case 'payment_confirmed':
            return () => whatsappService.sendPaymentReceiptMessage(user, payload);
        case 'cash_payment_request':
            return () => whatsappService.sendPaymentPendingMessage(user, payload, payload.documentUrl);
        case 'upi_payment_pending':
            return () => whatsappService.sendUpiPaymentPendingUser(payload);
        case 'user_registered':
            return () => whatsappService.sendWelcomeMessage(user);
        case 'membership_expiry_reminder':
            return () => whatsappService.sendExpiryReminder(payload);
        case 'membership_overdue_reminder':
            return () => whatsappService.sendOverdueReminder(payload);
        case 'membership_expired':
            return () => whatsappService.sendExpiredAlert(payload);
        default:
            return null; // unknown event — cannot rebuild
    }
}

// ── retryFailedNotifications ───────────────────────────────────────────────────
// Safety net that makes delivery eventually-consistent: periodically finds logs that
// FAILED at send time (transient/network/rate-limit) and re-sends them on a backoff.
//  - Skips delivery failures reported by Meta's webhook (metaError.source === 'webhook')
//    because re-sending those to a number that can't receive would just spam.
//  - Skips permanent_failure (auth/bad number/role skip).
//  - Gives up after MAX_NOTIFICATION_RETRIES and marks permanent_failure.
async function retryFailedNotifications() {
    const now = new Date();
    let logs;
    try {
        logs = await NotificationLog.find({
            status: 'failed',
            retryCount: { $lt: MAX_NOTIFICATION_RETRIES },
            $and: [
                { $or: [{ nextRetryAt: { $lte: now } }, { nextRetryAt: { $exists: false } }, { nextRetryAt: null }] },
                { $or: [{ 'metaError.source': { $ne: 'webhook' } }, { metaError: { $exists: false } }] }
            ]
        }).limit(100);
    } catch (err) {
        console.error('[ENGINE] retryFailedNotifications — query error:', err.message);
        return { attempted: 0, sent: 0 };
    }

    if (!logs.length) return { attempted: 0, sent: 0 };
    console.log(`[ENGINE] 🔁 Retry sweeper: ${logs.length} failed notification(s) to re-attempt.`);

    let sent = 0;
    for (const logDoc of logs) {
        try {
            const sendFn = await buildSendFnForLog(logDoc);
            if (!sendFn) {
                logDoc.status = 'permanent_failure';
                logDoc.metaError = { message: `Unknown eventType "${logDoc.eventType}" — cannot rebuild`, source: 'sweeper' };
                await logDoc.save();
                continue;
            }

            const result = await sendFn();
            if (result && result.success) {
                logDoc.status = 'sent';
                logDoc.messageId = result.messageId;
                logDoc.retryCount = (logDoc.retryCount || 0) + 1;
                logDoc.lastRetryAt = new Date();
                await logDoc.save();
                sent++;
                console.log(`[ENGINE] ✅ Retry succeeded for logId ${logDoc._id} (${logDoc.eventType}).`);
            } else {
                // null = skipped by a business rule (e.g. role) → don't keep retrying
                logDoc.status = 'permanent_failure';
                logDoc.retryCount = (logDoc.retryCount || 0) + 1;
                logDoc.lastRetryAt = new Date();
                await logDoc.save();
            }
        } catch (err) {
            const attempts = (logDoc.retryCount || 0) + 1;
            const permanent = err.isAuthError || err.isRetryable === false || attempts >= MAX_NOTIFICATION_RETRIES;
            logDoc.retryCount = attempts;
            logDoc.lastRetryAt = new Date();
            logDoc.status = permanent ? 'permanent_failure' : 'failed';
            logDoc.metaError = err.metaError ? { ...err.metaError, source: 'send' } : { message: err.message, source: 'send' };
            if (!permanent) {
                const idx = Math.min(attempts, RETRY_BACKOFF_MINUTES.length - 1);
                logDoc.nextRetryAt = new Date(Date.now() + RETRY_BACKOFF_MINUTES[idx] * 60000);
            }
            await logDoc.save();
            if (err.isAuthError) {
                console.error('[ENGINE] 🔑 Retry sweeper hit an AUTH failure — token needs refreshing; pausing retries for this log.');
            } else {
                console.warn(`[ENGINE] Retry ${attempts}/${MAX_NOTIFICATION_RETRIES} failed for logId ${logDoc._id}: ${err.message}`);
            }
        }
        await new Promise((r) => setTimeout(r, 300)); // spacing to respect Meta rate limits
    }

    console.log(`[ENGINE] 🔁 Retry sweeper done: ${sent}/${logs.length} delivered.`);
    return { attempted: logs.length, sent };
}

function setupListeners() {

    // ── Payment receipt: sent for any confirmed payment (UPI auto-verified OR admin-confirmed) ─
    // sendPaymentReceiptMessage tries payment_receipt_template (in review) first.
    // If Meta returns code 132001/132000 it auto-falls back to payment_receipt_template_fallback.
    // Once Meta approves payment_receipt_template, the better bullet-format is used automatically.
    notificationEmitter.on('payment_confirmed', async ({ user, paymentData, documentUrl }) => {
        console.log(`[ENGINE] payment_confirmed → sending receipt to ${user.email} | plan=${paymentData.planName} amount=${paymentData.amount}`);
        await logAndSendNotification({
            user,
            eventType: 'payment_confirmed',
            templateName: 'payment_receipt_template',  // will fall back to _fallback if still in review
            payload: { ...paymentData, documentUrl },
            sendFn: async () => await whatsappService.sendPaymentReceiptMessage(user, paymentData)
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

    // ── UPI payment pending (transaction submitted, awaiting admin verify) ─
    // NOTE: paymentData here is { userName, email, planName, planPrice, transactionId }
    //       whatsappService.sendUpiPaymentPendingUser() resolves user by email internally.
    //       We must pre-resolve the user so logAndSendNotification has a phone for logging.
    notificationEmitter.on('upi_payment_pending', async ({ user, paymentData }) => {
        console.log(`[ENGINE] upi_payment_pending → sending UPI instructions to ${paymentData.email || user?.email}`);

        // Resolve the real user document so we have phone for logging
        let resolvedUser = user;
        if ((!resolvedUser || !resolvedUser.phone) && paymentData.email) {
            const User = require('../models/User');
            const found = await User.findOne({ email: new RegExp(`^${paymentData.email}$`, 'i') });
            if (found) resolvedUser = found;
        }

        await logAndSendNotification({
            user: resolvedUser,
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

module.exports = { executeWithRetry, retryFailedNotifications, buildSendFnForLog };
