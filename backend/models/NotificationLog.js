const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, required: true },
    templateName: { type: String, required: true },
    eventType: { type: String }, // e.g. 'payment_confirmed', 'cash_payment_request'
    payload: { type: mongoose.Schema.Types.Mixed }, // The components sent to Meta
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'permanent_failure'],
        default: 'pending'
    },
    messageId: { type: String }, // The wamid.XYZ from Meta
    metaError: { type: mongoose.Schema.Types.Mixed }, // If failed, the error object
    fbtraceId: { type: String }, // For tracing Meta errors
    retryCount: { type: Number, default: 0 },
    lastRetryAt: { type: Date },
    nextRetryAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
