const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: '' }, // Image URL or base64
    discount: { type: String, default: '' }, // Discount or Offer Price
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
