const express = require('express');
const router = express.Router();
const verifyAdmin = require('./middleware/verifyAdmin');
const User = require('./models/User');
const FormSubmission = require('./models/FormSubmission');
const Package = require('./models/Package');
const Trainer = require('./models/Trainer');
const Offer = require('./models/Offer');
const Gallery = require('./models/Gallery');
const Content = require('./models/Content');

// Protect all admin routes
router.use(verifyAdmin);

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
router.get('/analytics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeMembers = await User.countDocuments({ role: 'user' });
        const totalEnquiries = await FormSubmission.countDocuments({ type: 'enquiry' });
        const pendingPayments = 0;

        const recentActivities = await FormSubmission.find().sort({ createdAt: -1 }).limit(5);

        // Aggregate Registration Data by Month (e.g., last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const usersByMonth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const enquiriesByMonth = await FormSubmission.aggregate([
            { $match: { type: 'enquiry', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Merge into expected graph format
        let chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthNum = d.getMonth() + 1;

            const userCount = usersByMonth.find(m => m._id === monthNum)?.count || 0;
            const enquiryCount = enquiriesByMonth.find(m => m._id === monthNum)?.count || 0;

            chartData.push({
                name: monthNames[monthNum - 1],
                users: userCount,
                enquiries: enquiryCount
            });
        }

        res.json({
            totalUsers,
            activeMembers,
            totalEnquiries,
            pendingPayments,
            recentActivities,
            chartData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

// ==========================================
// USERS MANAGEMENT
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// ==========================================
// FORM SUBMISSIONS (Enquiries, Feedback, Classes, PT Docs)
// ==========================================
router.get('/forms/:type', async (req, res) => {
    try {
        const forms = await FormSubmission.find({ type: req.params.type }).sort({ createdAt: -1 });
        res.json(forms);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching form submissions' });
    }
});

router.put('/forms/:id', async (req, res) => {
    try {
        const updated = await FormSubmission.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating form submission' });
    }
});

router.delete('/forms/:id', async (req, res) => {
    try {
        await FormSubmission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Submission deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting submission' });
    }
});

// ==========================================
// PACKAGES MANAGEMENT
// ==========================================
router.get('/packages', async (req, res) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching packages' });
    }
});

router.post('/packages', async (req, res) => {
    try {
        const newPackage = await Package.create(req.body);
        res.status(201).json(newPackage);
    } catch (err) {
        res.status(500).json({ message: 'Error creating package' });
    }
});

router.put('/packages/:id', async (req, res) => {
    try {
        const updated = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating package' });
    }
});

router.delete('/packages/:id', async (req, res) => {
    try {
        await Package.findByIdAndDelete(req.params.id);
        res.json({ message: 'Package deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting package' });
    }
});

// ==========================================
// TRAINERS MANAGEMENT
// ==========================================
router.get('/trainers', async (req, res) => {
    try {
        const trainers = await Trainer.find().sort({ createdAt: -1 });
        res.json(trainers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching trainers' });
    }
});

router.post('/trainers', async (req, res) => {
    try {
        const trainer = await Trainer.create(req.body);
        res.status(201).json(trainer);
    } catch (err) {
        res.status(500).json({ message: 'Error creating trainer' });
    }
});

router.put('/trainers/:id', async (req, res) => {
    try {
        const updated = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating trainer' });
    }
});

router.delete('/trainers/:id', async (req, res) => {
    try {
        await Trainer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Trainer deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting trainer' });
    }
});

// ==========================================
// OFFERS MANAGEMENT
// ==========================================
router.get('/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
});

router.post('/offers', async (req, res) => {
    try {
        const offer = await Offer.create(req.body);
        res.status(201).json(offer);
    } catch (err) {
        res.status(500).json({ message: 'Error creating offer' });
    }
});

router.put('/offers/:id', async (req, res) => {
    try {
        const updated = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating offer' });
    }
});

router.delete('/offers/:id', async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting offer' });
    }
});

// ==========================================
// GALLERY MANAGEMENT
// ==========================================
router.get('/gallery', async (req, res) => {
    try {
        const images = await Gallery.find().sort({ createdAt: -1 });
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching gallery' });
    }
});

router.post('/gallery', async (req, res) => {
    try {
        const image = await Gallery.create(req.body);
        res.status(201).json(image);
    } catch (err) {
        res.status(500).json({ message: 'Error adding image' });
    }
});

router.put('/gallery/:id', async (req, res) => {
    try {
        const updated = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating image' });
    }
});

router.delete('/gallery/:id', async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting image' });
    }
});

// ==========================================
// CMS MANAGEMENT
// ==========================================
router.get('/content/:section', async (req, res) => {
    try {
        const content = await Content.findOne({ section: req.params.section });
        res.json(content || { data: {} });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching content' });
    }
});

router.put('/content/:section', async (req, res) => {
    try {
        const { data } = req.body;
        const updated = await Content.findOneAndUpdate(
            { section: req.params.section },
            { section: req.params.section, data, updatedBy: req.user._id },
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error updating content' });
    }
});

module.exports = router;
