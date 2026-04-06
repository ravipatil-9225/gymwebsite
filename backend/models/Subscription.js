const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planName: { type: String, required: true },
    planDuration: { type: Number, required: true }, // in months
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    price: { type: Number, required: true },
    // Advanced: Payment integration placeholder
    paymentMethod: { type: String, default: 'card' }, // Stripe/Razorpay placeholder
    transactionId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
