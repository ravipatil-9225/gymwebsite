const Payment = require('../models/Payment');
const Package = require('../models/Package');
const tesseract = require('tesseract.js');
const socket = require('../socket');
const User = require('../models/User');
const Membership = require('../models/Membership');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// Helper: parse price string like "1,200" → 1200
function parsePrice(price) {
    if (typeof price === 'number') return price;
    return parseFloat(String(price).replace(/,/g, '')) || 0;
}

// Helper: parse plan duration string into days
async function getPlanDurationDays(planName) {
    const parse = (str = '') => {
        const s = str.toLowerCase();
        if (s.includes('year'))  { const m = s.match(/(\d+)\s*year/);  return (m ? +m[1] : 1) * 365; }
        if (s.includes('month')) { const m = s.match(/(\d+)\s*month/); return (m ? +m[1] : 1) * 30;  }
        if (s.includes('week'))  { const m = s.match(/(\d+)\s*week/);  return (m ? +m[1] : 1) * 7;   }
        if (s.includes('day'))   { const m = s.match(/(\d+)\s*day/);   return m ? +m[1] : 30;         }
        return 30;
    };
    try {
        const pkg = await Package.findOne({ name: planName });
        if (pkg?.duration) return parse(pkg.duration);
    } catch (_) {}
    return parse(planName);
}

exports.verifyPayment = async (req, res) => {
    try {
        const { userName, email, planName, planPrice, transactionId, screenshotUrl, paymentMethod } = req.body;

        if (!userName || !email || !planName || !planPrice) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const numericPrice = parsePrice(planPrice);
        const method = paymentMethod || 'upi';

        // ── CASH ON BENCH FLOW ──────────────────────────────────────────────────
        if (method === 'cash_on_bench') {
            const newPayment = await Payment.create({
                userName,
                email,
                planName,
                planPrice: numericPrice,
                paymentMethod: 'cash_on_bench',
                verificationStatus: 'cash_pending',
            });

            // Send emails to user AND owner (fire & forget)
            emailService.sendCashPaymentPendingUser({
                userName, email, planName, planPrice: numericPrice,
            }).catch(console.error);

            // Send WhatsApp
            whatsappService.sendCashPaymentPendingUser({
                userName, email, planName, planPrice: numericPrice,
            }).catch(console.error);

            emailService.sendCashPaymentPendingOwner({
                userName, email, planName, planPrice: numericPrice,
            }).catch(console.error);

            // Emit socket event for real-time admin update
            try { socket.getIO().emit('db_changed', { type: 'payment_cash', data: newPayment }); } catch (_) {}

            return res.status(201).json({
                message: 'Cash Payment Request Received',
                payment: newPayment,
            });
        }

        // ── UPI / SCREENSHOT FLOW ───────────────────────────────────────────────
        if (!transactionId || !screenshotUrl) {
            return res.status(400).json({ message: 'Transaction ID and screenshot are required for UPI payment.' });
        }

        // Check for duplicate transaction ID
        const existing = await Payment.findOne({ transactionId });
        if (existing) {
            return res.status(400).json({ message: 'Transaction ID already used.' });
        }

        console.log(`Starting OCR for ${transactionId}...`);

        // Extract base64 image data
        let imageBuffer;
        if (screenshotUrl.startsWith('data:image')) {
            const base64Data = screenshotUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            imageBuffer = Buffer.from(screenshotUrl, 'base64');
        }

        // Run Tesseract OCR (with fallback if OCR crashes)
        let text = '';
        let confidence = 0;
        try {
            const result = await tesseract.recognize(imageBuffer, 'eng');
            text = result.data.text || '';
            confidence = result.data.confidence || 0;
            console.log('OCR Result Text:', text);
            console.log('OCR Confidence:', confidence);
        } catch (ocrErr) {
            console.error('Tesseract OCR failed, falling back to manual verification:', ocrErr.message);
            // Default to empty text so it falls back to failed_verification for manual review
        }

        // Matching Logic
        const normalizedText = text.replace(/\s+/g, '').toLowerCase();
        const normalizedInputTxn = transactionId.replace(/\s+/g, '').toLowerCase();

        const isTxnMatch = normalizedText.includes(normalizedInputTxn);
        const priceStr = numericPrice.toString();
        const isAmountMatch = normalizedText.includes(priceStr.replace(/,/g, '')) || text.includes(priceStr);

        let status = 'failed_verification';
        let extractedTxnId = null;

        if (isTxnMatch && isAmountMatch) {
            status = 'auto_verified';
            extractedTxnId = transactionId;
        } else {
            status = 'failed_verification';
            const match12 = text.match(/\d{12}/);
            if (match12) extractedTxnId = match12[0];
        }

        const newPayment = await Payment.create({
            userName,
            email,
            planName,
            planPrice: numericPrice,
            paymentMethod: 'upi',
            transactionId,
            extractedTransactionId: extractedTxnId,
            verificationStatus: status,
            screenshotUrl,
            ocrConfidence: confidence,
        });

        // ── Notify user (payment pending/review) ────────────────────────────────
        emailService.sendUpiPaymentPendingUser({
            userName, email, planName, planPrice: numericPrice, transactionId,
        }).catch(console.error);

        whatsappService.sendUpiPaymentPendingUser({
            userName, email, planName, planPrice: numericPrice, transactionId,
        }).catch(console.error);

        // ── Notify owner with full OCR details ──────────────────────────────────
        emailService.sendUpiPaymentPendingOwner({
            userName, email, planName, planPrice: numericPrice,
            transactionId, ocrConfidence: confidence, verificationStatus: status,
        }).catch(console.error);

        // ── Activate membership if auto-verified ─────────────────────────────────
        if (status === 'auto_verified') {
            const user = await User.findOne({ email });
            if (user) {
                const planDuration = await getPlanDurationDays(planName);
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + planDuration);

                await Membership.create({
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    packageName: planName,
                    planDuration,
                    amountPaid: numericPrice,
                    startDate,
                    endDate,
                });

                // Emit AFTER membership is created so admin sees it instantly
                try { socket.getIO().emit('db_changed', { type: 'membership_created', userId: user._id }); } catch (_) {}

                // User gets full confirmation receipt
                emailService.sendPaymentConfirmation({
                    name: user.name,
                    email: user.email,
                    packageName: planName,
                    amountPaid: numericPrice,
                    startDate,
                    endDate,
                }).catch(console.error);

                whatsappService.sendPaymentConfirmation({
                    name: user.name,
                    email: user.email,
                    packageName: planName,
                    amountPaid: numericPrice,
                    startDate,
                    endDate,
                }).catch(console.error);

                // Owner gets approval alert
                emailService.sendPaymentApprovedOwner({
                    userName: user.name,
                    email: user.email,
                    planName,
                    planPrice: numericPrice,
                    paymentMethod: 'upi',
                    startDate,
                    endDate,
                }).catch(console.error);
            }
        }

        // For non-auto-verified: emit so admin sees the pending payment
        try { socket.getIO().emit('db_changed', { type: 'payment_verified', data: newPayment }); } catch (_) {}

        res.status(201).json({
            message: status === 'auto_verified'
                ? 'Payment Verified Automatically'
                : 'Verification Failed - Awaiting Admin Review',
            payment: newPayment,
        });

    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ message: 'Server error during payment verification.' });
    }
};
