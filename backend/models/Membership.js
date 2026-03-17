const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    packageName: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    // Reminder flags to avoid duplicate emails
    reminder7Sent: { type: Boolean, default: false },
    reminder3Sent: { type: Boolean, default: false },
    reminderExpirySent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Membership', membershipSchema);
