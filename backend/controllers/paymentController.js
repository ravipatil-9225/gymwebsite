const Payment = require('../models/Payment');
const tesseract = require('tesseract.js');
const socket = require('../socket');
const fs = require('fs');
const User = require('../models/User');
const Membership = require('../models/Membership');
const emailService = require('../services/emailService');

exports.verifyPayment = async (req, res) => {
    try {
        const { userName, email, planName, planPrice, transactionId, screenshotUrl } = req.body;

        if (!userName || !email || !planName || !planPrice || !transactionId || !screenshotUrl) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check for duplicate transaction ID
        const existing = await Payment.findOne({ transactionId });
        if (existing) {
            return res.status(400).json({ message: 'Transaction ID already used.' });
        }

        console.log(`Starting OCR for ${transactionId}...`);
        
        // Extract base64 data correctly (assuming it's formatted as data:image/png;base64,.....)
        let imageBuffer;
        if (screenshotUrl.startsWith('data:image')) {
            const base64Data = screenshotUrl.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
            // If it's sent as a plain base64 string or an actual file URL
            imageBuffer = Buffer.from(screenshotUrl, 'base64');
        }

        // Run Tesseract
        const { data: { text, confidence } } = await tesseract.recognize(
            imageBuffer,
            'eng'
        );

        console.log('OCR Result Text:', text);
        console.log('OCR Confidence:', confidence);

        // Matching Logic
        // Normalize text: remove spaces, lowercase to handle OCR anomalies
        const normalizedText = text.replace(/\s+/g, '').toLowerCase();
        const normalizedInputTxn = transactionId.replace(/\s+/g, '').toLowerCase();

        // 1. Check if Transaction ID matches exactly
        const isTxnMatch = normalizedText.includes(normalizedInputTxn);

        // 2. Check if Amount matches (Optional logic if needed, but required by user prompts)
        // Usually amount looks like rs 1000 or ₹1000 or 1,000. Let's look for the amount string simply
        const isAmountMatch = normalizedText.includes(planPrice.toString()) || text.includes(planPrice.toString());

        let status = 'failed_verification';
        let extractedTxnId = null;

        if (isTxnMatch && isAmountMatch) {
            status = 'auto_verified';
            extractedTxnId = transactionId; // Since it was verified true, we use it as extracted
        } else {
            status = 'failed_verification';
            // We could try to extract something that looks like a txn id, e.g. a 12 digit number
            const match12 = text.match(/\d{12}/);
            if (match12) {
                extractedTxnId = match12[0];
            }
        }

        const newPayment = await Payment.create({
            userName,
            email,
            planName,
            planPrice,
            transactionId,
            extractedTransactionId: extractedTxnId,
            verificationStatus: status,
            screenshotUrl, // Storing as base64 in DB (fine for simple setups)
            ocrConfidence: confidence
        });

        // Activate membership if verified
        if (status === 'auto_verified') {
            const user = await User.findOne({ email });
            if (user) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30); // Default to 30 days

                await Membership.create({
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    packageName: planName,
                    amountPaid: planPrice,
                    startDate,
                    endDate,
                });

                emailService.sendPaymentConfirmation({
                    name: user.name,
                    email: user.email,
                    packageName: planName,
                    amountPaid: planPrice,
                    startDate,
                    endDate,
                }).catch(console.error);
            }
        }

        // Emit socket event for real-time admin update
        socket.getIO().emit('db_changed', { type: 'payment_verified', data: newPayment });

        res.status(201).json({
            message: status === 'auto_verified' ? 'Payment Verified Automatically' : 'Verification Failed - Awaiting Admin Review',
            payment: newPayment
        });

    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ message: 'Server error during payment verification.' });
    }
};
