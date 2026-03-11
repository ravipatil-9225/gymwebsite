const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    title: { type: String, trim: true, default: '' },
    category: { type: String, default: 'General' }, // e.g., 'Gym', 'Classes', 'Transformation'
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
