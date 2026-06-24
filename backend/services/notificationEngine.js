/**
 * notificationEngine.js
 * 
 * Binds to notificationEmitter events and calls whatsappService directly.
 * Each event handler is fully awaited inside its own async scope.
 * Errors are caught and logged — the server never crashes.
 * 
 * Also exports executeWithRetry() for the admin retry endpoint.
 */

const notificationEmitter = require('../events/notificationEmitter');
const whatsappService = require('./whatsappService');

// ── executeWithRetry ────────────────────────────────────────────────────────
// Wraps a single WhatsApp service call. Runs async in background.
// Called by adminRoutes retry endpoint.
async function executeWithRetry(logId, fn) {
    try {
        console.log(`[ENGINE] executeWithRetry — attempting logId: ${logId}`);
        await fn();
        console.log(`[ENGINE] executeWithRetry — success for logId: ${logId}`);
    } catch (err) {
        console.error(`[ENGINE] executeWithRetry — failed for logId: ${logId}:`, err.message);
    }
}

function setupListeners() {

    // ── Payment receipt after admin verifies (cash OR upi) ──────────────
    notificationEmitter.on('payment_confirmed', async ({ user, paymentData, documentUrl }) => {
        try {
            console.log(`[ENGINE] payment_confirmed → sending receipt to ${user.email}`);
            await whatsappService.sendPaymentConfirmedMessage(user, paymentData, documentUrl);
        } catch (err) {
            console.error('[ENGINE] payment_confirmed failed:', err.message);
        }
    });

    // ── Cash on Bench request sent to user ──────────────────────────────
    notificationEmitter.on('cash_payment_request', async ({ user, paymentData, documentUrl }) => {
        try {
            console.log(`[ENGINE] cash_payment_request → sending pending notice to ${user.email}`);
            await whatsappService.sendPaymentPendingMessage(user, paymentData, documentUrl);
        } catch (err) {
            console.error('[ENGINE] cash_payment_request failed:', err.message);
        }
    });

    // ── UPI payment pending ──────────────────────────────────────────────
    notificationEmitter.on('upi_payment_pending', async ({ user, paymentData }) => {
        try {
            console.log(`[ENGINE] upi_payment_pending → sending UPI instructions to ${user.email}`);
            await whatsappService.sendUpiPaymentPendingUser(paymentData);
        } catch (err) {
            console.error('[ENGINE] upi_payment_pending failed:', err.message);
        }
    });

    // ── New member welcome ───────────────────────────────────────────────
    notificationEmitter.on('user_registered', async ({ user }) => {
        try {
            console.log(`[ENGINE] user_registered → sending welcome to ${user.email}`);
            await whatsappService.sendWelcomeMessage(user);
        } catch (err) {
            console.error('[ENGINE] user_registered failed:', err.message);
        }
    });

    // ── Expiry reminder (3-day / 7-day) ─────────────────────────────────
    notificationEmitter.on('membership_expiry_reminder', async ({ user, reminderData }) => {
        try {
            console.log(`[ENGINE] membership_expiry_reminder → reminding ${user.email}`);
            await whatsappService.sendExpiryReminder(reminderData);
        } catch (err) {
            console.error('[ENGINE] membership_expiry_reminder failed:', err.message);
        }
    });

    // ── Pay-Later overdue ────────────────────────────────────────────────
    notificationEmitter.on('membership_overdue_reminder', async ({ user, reminderData }) => {
        try {
            console.log(`[ENGINE] membership_overdue_reminder → nudging ${user.email}`);
            await whatsappService.sendOverdueReminder(reminderData);
        } catch (err) {
            console.error('[ENGINE] membership_overdue_reminder failed:', err.message);
        }
    });

    // ── Membership expired ───────────────────────────────────────────────
    notificationEmitter.on('membership_expired', async ({ user, reminderData }) => {
        try {
            console.log(`[ENGINE] membership_expired → alerting ${user.email}`);
            await whatsappService.sendExpiredAlert(reminderData);
        } catch (err) {
            console.error('[ENGINE] membership_expired failed:', err.message);
        }
    });

    console.log('[ENGINE] ✅ WhatsApp notification listeners registered for all 7 event types.');
}

setupListeners();

module.exports = { executeWithRetry };
