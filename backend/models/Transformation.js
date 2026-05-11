const mongoose = require('mongoose');

const transformationSchema = new mongoose.Schema({
    memberName: { type: String, required: true, trim: true },
    beforeImage: { type: String, required: true },
    afterImage: { type: String, required: true },
    duration: { type: String, default: '' },          // e.g. "3 Months", "6 Months"
    weightBefore: { type: String, default: '' },       // e.g. "95 kg"
    weightAfter: { type: String, default: '' },        // e.g. "78 kg"
    testimonial: { type: String, default: '' },        // Member quote
    programme: { type: String, default: '' },          // e.g. "Strength + Cardio"
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Transformation', transformationSchema);
