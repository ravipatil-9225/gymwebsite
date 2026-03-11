const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['join', 'enquiry', 'feedback', 'group-class', 'pt-session', 'par-q', 'trial-waiver', 'pt-contract']
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        trim: true
    },
    date: {
        type: String, // Stored as a string from datetime-local input
    },
    service: {
        type: String, // Used for preferred trainer or class type
    },
    rating: {
        type: Number, // Used for feedback
        min: 1,
        max: 5
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'resolved']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
