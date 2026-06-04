const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const FormSubmission = require('../models/FormSubmission');
const whatsappService = require('../services/whatsappService');

// ──────────────────────────────────────────────────────────────
// WhatsApp Cloud API Webhook
// ──────────────────────────────────────────────────────────────
// Meta sends two types of requests to this endpoint:
//   1. GET  → Verification handshake (one-time, when you register the URL)
//   2. POST → Incoming messages, status updates, errors, etc.
// ──────────────────────────────────────────────────────────────

/**
 * GET /api/webhook/whatsapp
 * 
 * Meta's webhook verification. When you enter your Callback URL
 * in the Meta dashboard and click "Verify and Save", Meta sends a
 * GET request with these query params:
 *   - hub.mode        → should be "subscribe"
 *   - hub.verify_token → should match your WHATSAPP_VERIFY_TOKEN
 *   - hub.challenge    → a random string Meta expects back
 * 
 * If everything matches, respond with the challenge to confirm.
 */
router.get('/', (req, res) => {
    // Debug: log raw query to diagnose issues
    console.log('🔍 WhatsApp Webhook GET received. Query:', JSON.stringify(req.query));

    // Express may parse "hub.mode" as req.query['hub.mode'] OR as req.query.hub.mode (nested)
    const mode = req.query['hub.mode'] || (req.query.hub && req.query.hub.mode);
    const token = req.query['hub.verify_token'] || (req.query.hub && req.query.hub.verify_token);
    const challenge = req.query['hub.challenge'] || (req.query.hub && req.query.hub.challenge);

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'tara_fitness_whatsapp_verify_2024';

    console.log('🔍 Parsed values — mode:', mode, '| token:', token, '| VERIFY_TOKEN:', VERIFY_TOKEN);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ WhatsApp Webhook verified successfully!');
        return res.status(200).send(challenge);
    } else {
        console.warn('❌ WhatsApp Webhook verification failed. Token mismatch.');
        return res.sendStatus(403);
    }
});

/**
 * POST /api/webhook/whatsapp
 * 
 * Receives incoming messages, delivery/read receipts, and errors.
 * Meta REQUIRES you to always respond with 200 OK quickly,
 * otherwise it will retry and eventually disable your webhook.
 */
router.post('/', (req, res) => {
    const body = req.body;

    // Ensure this is a WhatsApp notification
    if (body.object === 'whatsapp_business_account') {
        // Process each entry
        body.entry?.forEach(entry => {
            entry.changes?.forEach(change => {
                const value = change.value;

                // ── Incoming Messages ──
                if (value.messages) {
                    value.messages.forEach(async (message) => {
                        const from = message.from;           // Sender's phone number
                        const msgType = message.type;        // text, image, document, etc.
                        const timestamp = message.timestamp;

                        console.log(`📩 WhatsApp message from ${from} [${msgType}] at ${new Date(timestamp * 1000).toLocaleString()}`);

                        if (msgType === 'text') {
                            const messageText = message.text.body;
                            console.log(`   Message: "${messageText}"`);

                            try {
                                // Simply log the incoming message for now. 
                                // Auto-replies are handled directly by the controllers (e.g., paymentController)
                                // to prevent duplicate messages or incorrect fallback templates.
                                console.log(`📩 Logged incoming text message from ${from}`);
                            } catch (err) {
                                console.error('Error handling incoming WhatsApp message:', err);
                            }
                        }
                    });
                }

                // ── Message Status Updates (sent, delivered, read) ──
                if (value.statuses) {
                    value.statuses.forEach(status => {
                        console.log(`📊 WhatsApp status: Message to ${status.recipient_id} → ${status.status}`);
                    });
                }
            });
        });

        // Always respond 200 OK to Meta (REQUIRED)
        return res.sendStatus(200);
    }

    // Not a WhatsApp event
    return res.sendStatus(404);
});

module.exports = router;
