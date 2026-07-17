const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },  // product/plan name
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 },
    total: { type: Number, required: true },
    itemType: { type: String, enum: ['membership', 'product', 'other'], default: 'other' },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, unique: true },  // Auto-generated: INV-00001

    // Linked user (optional — can be walk-in)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    memberName: { type: String, required: true },
    memberPhone: { type: String, default: '' },
    memberEmail: { type: String, default: '' },
    memberId: { type: String, default: '' },  // short member ID display

    billingDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },

    items: [invoiceItemSchema],

    subTotal:    { type: Number, default: 0 },
    discount:    { type: Number, default: 0 },  // flat amount
    misc:        { type: Number, default: 0 },
    tax:         { type: Number, default: 0 },  // GST etc.
    totalAmount: { type: Number, default: 0 },
    paid:        { type: Number, default: 0 },
    pending:     { type: Number, default: 0 },
    rewardPointsRedeemed: { type: Number, default: 0 },

    paymentMethod: { type: String, default: 'Cash' },  // Cash, UPI, Card, etc.
    billedBy: { type: String, default: 'Admin' },       // Admin name who created

    notes: { type: String, default: '' },
    terms: {
        type: String,
        default: '1. Payment once made will be non refundable and non transferable.\n2. This invoice is valid for 30 days from the billing date.'
    },

    status: {
        type: String,
        enum: ['paid', 'pending', 'partial'],
        default: 'paid'
    },

    invoiceType: {
        type: String,
        enum: ['membership', 'products', 'mixed'],
        default: 'membership'
    },
}, { timestamps: true });

// Auto-generate invoice number before save
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
    }
    // Recalculate totals
    this.subTotal = this.items.reduce((s, i) => s + i.total, 0);
    this.totalAmount = Math.max(0, this.subTotal - this.discount + this.misc + this.tax - this.rewardPointsRedeemed);
    this.pending = Math.max(0, this.totalAmount - this.paid);
    this.status = this.pending <= 0 ? 'paid' : (this.paid > 0 ? 'partial' : 'pending');
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
