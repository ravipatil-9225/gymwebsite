const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const verifyAdmin = require('../middleware/verifyAdmin');

// ── Public: get all active products (with filters) ────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { category, search, sortBy, minPrice, maxPrice, brand } = req.query;
        const filter = { isActive: true };

        if (category && category !== 'All') filter.category = category;
        if (brand) filter.brand = new RegExp(brand, 'i');
        if (search) filter.$or = [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { brand: new RegExp(search, 'i') },
            { tags: new RegExp(search, 'i') },
        ];
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        let sortObj = { createdAt: -1 };
        if (sortBy === 'price_asc') sortObj = { price: 1 };
        else if (sortBy === 'price_desc') sortObj = { price: -1 };
        else if (sortBy === 'name_asc') sortObj = { name: 1 };
        else if (sortBy === 'name_desc') sortObj = { name: -1 };
        else if (sortBy === 'newest') sortObj = { createdAt: -1 };
        else if (sortBy === 'featured') sortObj = { isFeatured: -1, createdAt: -1 };

        const products = await Product.find(filter).sort(sortObj);
        const categories = await Product.distinct('category', { isActive: true });
        const brands = await Product.distinct('brand', { isActive: true, brand: { $ne: '' } });

        res.json({ products, categories, brands });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── Admin: get ALL products (including inactive) ──────────────────────────────
router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        const categories = await Product.distinct('category');
        res.json({ products, categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── Admin: create product ─────────────────────────────────────────────────────
router.post('/admin', verifyAdmin, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ── Admin: update product ─────────────────────────────────────────────────────
router.put('/admin/:id', verifyAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ── Admin: delete product ─────────────────────────────────────────────────────
router.delete('/admin/:id', verifyAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
