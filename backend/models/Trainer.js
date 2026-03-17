const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    experience: { type: String, trim: true }, // e.g., '5 Years'
    certifications: { type: String, trim: true },
    description: { type: String, trim: true }, // Bio
    instagramId: { type: String, trim: true }, // Profile link or ID
    contact: { type: String, trim: true },
    photo: { type: String, default: '' }, // base64 or URL
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Trainer', trainerSchema);
