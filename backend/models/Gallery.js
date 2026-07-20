const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    title: { type: String, trim: true, default: '' },
    category: { type: String, default: 'Gym' }, // e.g., 'Gym', 'Workout', 'Events', 'Transformation'
    folder: { type: String, trim: true, default: 'General' }, // e.g., 'Gym Interior', 'Equipment', 'Events'
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
