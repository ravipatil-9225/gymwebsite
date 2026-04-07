const Payment = require('../models/Payment');
const Package = require('../models/Package');
const tesseract = require('tesseract.js');
const socket = require('../socket');
const User = require('../models/User');
const Membership = require('../models/Membership');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const { compressPaymentScreenshot, uploadToCloudinary } = require('../utils/imageHandler');

// Helper: parse price string like "1,200" → 1200
function parsePrice(price) {
    if (typeof price === 'number') return price;
    return parseFloat(String(price).replace(/,/g, '')) || 0;
}

// Helper: parse plan duration string into days
async function getPlanDurationDays(pkgOrName) {
    const parse = (str = '') => {
        const s = typeof str === 'string' ? str.toLowerCase() : '';
        if (s.includes('year'))  { const m = s.match(/(\d+)\s*year/);  return (m ? +m[1] : 1) * 365; }
        if (s.includes('month')) { const m = s.match(/(\d+)\s*month/); return (m ? +m[1] : 1) * 30;  }
        if (s.includes('week'))  { const m = s.match(/(\d+)\s*week/);  return (m ? +m[1] : 1) * 7;   }
        if (s.includes('day'))   { const m = s.match(/(\d+)\s*day/);   return m ? +m[1] : 30;         }
        return 30;
    };

    if (typeof pkgOrName === 'object' && pkgOrName?.duration) {
        return parse(pkgOrName.duration);
    }

    try {
        const pkg = await Package.findOne({ name: pkgOrName });
        if (pkg?.duration) return parse(pkg.duration);
    } catch (_) {}
    return parse(pkgOrName);
}

exports.checkDiscount = async (req, res) => {
    try {
        const { planName } = req.query;
        if (!planName) return res.status(400).json({ message: 'planName required' });

        const email = req.user.email;
        const existingDiscountPayment = await Payment.findOne({ 
            email, 
            planName, 
            verificationStatus: { $in: ['pending', 'cash_pending', 'failed_verification'] },
            discount: { $exists: true }
        }).sort({ createdAt: -1 });

        if (existingDiscountPayment && existingDiscountPayment.finalAmount !== undefined) {
            return res.json({ 
                hasDiscount: true, 
                originalAmount: existingDiscountPayment.originalAmount || existingDiscountPayment.planPrice,
                discount: existingDiscountPayment.discount,
                discountType: existingDiscountPayment.discountType,
                finalAmount: existingDiscountPayment.finalAmount
            });
        }
        res.json({ hasDiscount: false });
    } catch (err) {
        console.error('Check discount error:', err);
        res.status(500).json({ message: 'Server error check-discount' });
    }
};

exports.verifyAndUpload = async (req, res) => {
    try {
        const { userName, email, planName, packageId, transactionId, paymentMethod } = req.body;

        if (!userName || !email || (!planName && !packageId)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Fetch price strictly from DB to NEVER trust frontend
        let pkg = null;
        if (packageId) {
            pkg = await Package.findById(packageId);
        } else if (planName) {
            pkg = await Package.findOne({ name: planName });
        }

        if (!pkg) {
            return res.status(404).json({ message: 'Selected package not found in our records.' });
        }

        const numericPrice = parsePrice(pkg.price);
        const actualPlanName = pkg.name;
        const method = paymentMethod || 'upi';

        // Check for existing discount
        const existingDiscountPayment = await Payment.findOne({ 
            email, 
            planName: actualPlanName, 
            verificationStatus: { $in: ['pending', 'cash_pending', 'failed_verification'] },
            discount: { $exists: true }
        }).sort({ createdAt: -1 });

        const finalAmount = existingDiscountPayment && existingDiscountPayment.finalAmount !== undefined 
            ? existingDiscountPayment.finalAmount 
            : numericPrice;

        // ── PAY LATER FLOW ──────────────────────────────────────────────────────
        if (method === 'pay_later') {
            const user = await User.findOne({ email });
            
            if (pkg.allowPending === false) {
                return res.status(403).json({ message: 'Pay Later is disabled for this specific plan.' });
            }

            if (user && user.allowPendingPayment === false) {
                return res.status(403).json({ message: 'Immediate payment required. You are not authorized for Pay Later.' });
            }

            const planDuration = await getPlanDurationDays(pkg);
            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + planDuration);

            const newPayment = await Payment.create({
                userName, email, packageId: pkg._id, planName: actualPlanName, planPrice: finalAmount, originalAmount: numericPrice,
                paymentMethod: 'pay_later', verificationStatus: 'pending', startDate, expiryDate
            });

            // Activate membership immediately but status is pending payment
            if (user) {
                await Membership.create({
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    packageName: actualPlanName,
                    planDuration,
                    amountPaid: 0, // 0 paid so far
                    startDate,
                    endDate: expiryDate,
                });
                try { socket.getIO().emit('db_changed', { type: 'membership_created', userId: user._id }); } catch (_) {}
            }

            try { socket.getIO().emit('db_changed', { type: 'payment_pay_later', data: newPayment }); } catch (_) {}
            return res.status(201).json({ message: 'Pay Later Request Approved', payment: newPayment });
        }

        // ── CASH ON BENCH FLOW ──────────────────────────────────────────────────
        if (method === 'cash_on_bench') {
            const newPayment = await Payment.create({
                userName, email, packageId: pkg._id, planName: actualPlanName, planPrice: finalAmount, originalAmount: numericPrice,
                paymentMethod: 'cash_on_bench', verificationStatus: 'cash_pending',
            });
            emailService.sendCashPaymentPendingUser({ userName, email, planName: actualPlanName, planPrice: numericPrice }).catch(console.error);
            whatsappService.sendCashPaymentPendingUser({ userName, email, planName: actualPlanName, planPrice: numericPrice }).catch(console.error);
            emailService.sendCashPaymentPendingOwner({ userName, email, planName: actualPlanName, planPrice: numericPrice }).catch(console.error);
            try { socket.getIO().emit('db_changed', { type: 'payment_cash', data: newPayment }); } catch (_) {}
            
            return res.status(201).json({ message: 'Cash Payment Request Received', payment: newPayment });
        }

        // ── UPI / SCREENSHOT FLOW ───────────────────────────────────────────────
        if (!transactionId || !req.file) {
            return res.status(400).json({ message: 'Transaction ID and screenshot are required for UPI payment.' });
        }

        // 1. Transaction ID Uniqueness
        const existing = await Payment.findOne({ transactionId });
        if (existing) {
            return res.status(400).json({ message: 'Transaction ID already used. Duplicate submission prevented.' });
        }

        // OCR verification starting (production-silent)

        // 2. OCR VERIFICATION (CRITICAL) - Run on Original Image
        const originalBuffer = req.file.buffer;
        let text = '';
        let confidence = 0;
        try {
            const result = await tesseract.recognize(originalBuffer, 'eng');
            text = (result.data.text || '').toUpperCase();
            confidence = result.data.confidence || 0;
            // OCR confidence captured (production-silent)
        } catch (ocrErr) {
            console.error('Tesseract OCR failed:', ocrErr.message);
            return res.status(500).json({ message: 'Secure OCR verification failed. Please try again.' });
        }

        // 3. VALIDATION RULES
        const normalizedText = text.replace(/\s+/g, '');
        const normalizedInputTxn = transactionId.replace(/\s+/g, '').toUpperCase();
        
        // A. Transaction ID matches OCR output
        const isTxnMatch = normalizedText.includes(normalizedInputTxn);
        
        // B. Amount Check matches finalAmount
        const priceStr = finalAmount.toString();
        const pricePattern = new RegExp(`\\b${priceStr}\\b|INR[\\s]*${priceStr}|(?:RS\\.?|₹)[\\s]*${priceStr}`, 'i');
        const isAmountMatch = normalizedText.includes(priceStr) || text.includes(priceStr) || pricePattern.test(text);

        // C. Payment Status contains "SUCCESS", "PAID" or "COMPLETED" (Google Pay uses 'Completed')
        const isSuccessStatus = text.includes('SUCCESS') || text.includes('PAID') || text.includes('SUCCESSFUL') || text.includes('COMPLETED') || text.includes('COMPLETE');
        
        // D. Merchant Validation - Must contain gym business identifiers (supports old and new UPI IDs)
        const merchantValid = 
            text.includes('TARA') ||
            text.includes('FITNESS') ||
            text.includes('TARACHAND') ||
            text.includes('PARMAR') ||
            text.includes('UDDHAV') ||
            text.includes('9960552750') ||
            text.includes('OKSBI') ||
            text.includes('OKAXIS') ||
            text.includes('TARAPARMAR') ||
            normalizedText.includes('TARAPARMAR2');

        if (!isTxnMatch || !isAmountMatch || !isSuccessStatus || !merchantValid) {
            return res.status(400).json({ 
                message: 'Invalid or mismatched payment screenshot. Verification failed.',
                details: { txnMatch: isTxnMatch, amountMatch: isAmountMatch, successMatch: isSuccessStatus, merchantMatch: merchantValid }
            });
        }

        // 4. VERIFICATION SUCCESS -> Upload and Save
        let cloudResult = { url: '', public_id: '' };
        try {
            const compressedBuffer = await compressPaymentScreenshot(originalBuffer);
            cloudResult = await uploadToCloudinary(compressedBuffer, 'payment_screenshots');
        } catch (uploadErr) {
            console.error('Cloudinary upload failure:', uploadErr);
            return res.status(500).json({ message: 'Image secure storage failed.' });
        }

        // Save DB only on SUCCESS
        const newPayment = await Payment.create({
            userName,
            email,
            packageId: pkg._id,
            planName: actualPlanName,
            planPrice: finalAmount,
            originalAmount: numericPrice,
            paymentMethod: 'upi',
            transactionId,
            verificationStatus: 'auto_verified',
            ocrConfidence: confidence,
            screenshot: {
                url: cloudResult.url,
                public_id: cloudResult.public_id
            }
        });

        // Activate membership directly since it's fully verified
        const user = await User.findOne({ email });
        if (user) {
            const planDuration = await getPlanDurationDays(pkg);
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + planDuration);

            await Membership.create({
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                packageName: actualPlanName,
                planDuration,
                amountPaid: numericPrice,
                startDate,
                endDate,
            });

            try { socket.getIO().emit('db_changed', { type: 'membership_created', userId: user._id }); } catch (_) {}

            emailService.sendPaymentConfirmation({ name: user.name, email: user.email, packageName: actualPlanName, amountPaid: numericPrice, startDate, endDate }).catch(console.error);
            whatsappService.sendPaymentConfirmation({ name: user.name, email: user.email, packageName: actualPlanName, amountPaid: numericPrice, startDate, endDate }).catch(console.error);
            emailService.sendPaymentApprovedOwner({ userName: user.name, email: user.email, planName: actualPlanName, planPrice: numericPrice, paymentMethod: 'upi', startDate, endDate }).catch(console.error);
        }

        try { socket.getIO().emit('db_changed', { type: 'payment_verified', data: newPayment }); } catch (_) {}

        res.status(201).json({
            message: 'Payment verified securely! Your membership is instantly active.',
            payment: newPayment,
        });

    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ message: 'Server error during secure payment verification.' });
    }
};

exports.getMyPayments = async (req, res) => {
    try {
        const email = req.user.email;
        const payments = await Payment.find({ email }).sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching payments' });
    }
};
