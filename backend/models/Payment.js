const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    planName: { type: String, required: true },
    planPrice: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['upi', 'cash_on_bench'],
        default: 'upi'
    },
    transactionId: { type: String, unique: true, sparse: true },
    extractedTransactionId: { type: String },
    verificationStatus: { 
        type: String, 
        enum: ['pending', 'auto_verified', 'failed_verification', 'cash_pending', 'cash_collected', 'manually_verified', 'rejected'], 
        default: 'pending' 
    },
    screenshot: {
        url: { type: String, default: '' },
        public_id: { type: String, default: '' }
    },
    ocrConfidence: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
