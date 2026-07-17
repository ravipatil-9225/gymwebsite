const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const verifyAdmin = require('../middleware/verifyAdmin');

// ── GET all invoices (admin) ──────────────────────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const { search, status, type, from, to, limit = 100, page = 1 } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (type) filter.invoiceType = type;
        if (search) {
            filter.$or = [
                { memberName: new RegExp(search, 'i') },
                { invoiceNumber: new RegExp(search, 'i') },
                { memberPhone: new RegExp(search, 'i') },
                { memberEmail: new RegExp(search, 'i') },
            ];
        }
        if (from || to) {
            filter.billingDate = {};
            if (from) filter.billingDate.$gte = new Date(from);
            if (to) filter.billingDate.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
        }

        const total = await Invoice.countDocuments(filter);
        const invoices = await Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate('userId', 'name email phone');

        res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET single invoice ────────────────────────────────────────────────────────
router.get('/:id', verifyAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('userId', 'name email phone');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── CREATE invoice ────────────────────────────────────────────────────────────
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const invoice = new Invoice(req.body);
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ── UPDATE invoice ────────────────────────────────────────────────────────────
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        // Recalculate via pre-save hook by using findById + save
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        Object.assign(invoice, req.body);
        await invoice.save();
        res.json(invoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ── DELETE invoice ────────────────────────────────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET user list for invoice creation (admin helper) ────────────────────────
router.get('/meta/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, 'name email phone _id').sort({ name: 1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
