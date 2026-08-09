const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName:  { type: String, required: true },
    userEmail: { type: String, required: true },
    batchTime: { type: String, default: 'Not Assigned' },
    // Stored as a plain YYYY-MM-DD string so date comparisons are timezone-safe
    date: { type: String, required: true }, // e.g. "2026-06-25"
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'present'
    },
    checkInTime: { type: Date, default: null }, // exact timestamp
    markedBy: {
        type: String,
        enum: ['admin', 'self', 'biometric'],
        required: true
    },
    note: { type: String, default: '' }
}, { timestamps: true });

// One record per user per day — prevents duplicates
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
