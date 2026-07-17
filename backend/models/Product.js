const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0 }, // Original price for showing discount
    brand: { type: String, default: '' },
    weight: { type: String, default: '' }, // e.g. "1kg", "500g"
    flavour: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    image: { type: String, default: '' }, // URL or base64
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
