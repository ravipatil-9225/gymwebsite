const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    planName: { type: String, required: true },
    planPrice: { type: Number, required: true },
    transactionId: { type: String, required: true, unique: true },
    extractedTransactionId: { type: String },
    verificationStatus: { 
        type: String, 
        enum: ['pending', 'auto_verified', 'failed_verification'], 
        default: 'pending' 
    },
    screenshotUrl: { type: String, required: true },
    ocrConfidence: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
