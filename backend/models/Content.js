const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    section: { type: String, required: true, unique: true }, // e.g., 'homepage', 'contact'
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible storage for JSON content
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
