const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'BASIC TRAINING PACKAGES' },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g., '1 Month', '3 Months'
    features: [{ type: String }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
