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
const Payment = require('./models/Payment');
const Membership = require('./models/Membership');
const socket = require('./socket');
const emailService = require('./services/emailService');
const whatsappService = require('./services/whatsappService');

// Protect all admin routes
router.use(verifyAdmin);

// ==========================================
// DASHBOARD ANALYTICS
// ==========================================
router.get('/analytics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeMembers = await User.countDocuments({ role: 'user' });
        const totalEnquiries = await FormSubmission.countDocuments({ type: { $in: ['enquiry', 'join'] } });
        const pendingPayments = await Payment.countDocuments({ 
            verificationStatus: { $in: ['pending', 'cash_pending'] } 
        });
        const failedPayments = await Payment.countDocuments({ 
            verificationStatus: 'failed_verification' 
        });

        const recentForms = await FormSubmission.find().sort({ createdAt: -1 }).limit(10);
        const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(10);
        const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(10);

        // Merge and sort by date
        const recentActivities = [...recentForms.map(f => ({ ...f._doc, activityType: 'form' })),
        ...recentUsers.map(u => ({
            _id: u._id,
            name: u.name,
            type: 'registration',
            activityType: 'user',
            createdAt: u.createdAt
        })),
        ...recentPayments.map(p => ({
            _id: p._id,
            name: p.userName,
            type: p.paymentMethod === 'cash_on_bench' ? 'Cash Payment' : 'UPI Payment',
            activityType: 'payment',
            createdAt: p.createdAt
        }))]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

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
            { $match: { type: { $in: ['enquiry', 'join'] }, createdAt: { $gte: sixMonthsAgo } } },
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
            failedPayments,
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
        const users = await User.aggregate([
            { $sort: { createdAt: -1 } },
            { $project: { password: 0 } },
            {
                $lookup: {
                    from: 'memberships',
                    let: { uid: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
                        { $sort: { createdAt: -1 } }
                    ],
                    as: 'allMemberships'
                }
            },
            {
                $addFields: {
                    latestMembership: { $arrayElemAt: ['$allMemberships', 0] }
                }
            }
        ]);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json(updated);
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// ==========================================
// FORM SUBMISSIONS (Enquiries, Feedback, Classes, PT Docs)
// ==========================================
router.get('/forms/:type', async (req, res) => {
    try {
        let query = { type: req.params.type };
        if (req.params.type === 'enquiry') {
            query = { type: { $in: ['enquiry', 'join'] } };
        }
        const forms = await FormSubmission.find(query).sort({ createdAt: -1 });
        res.json(forms);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching form submissions' });
    }
});

router.put('/forms/:id', async (req, res) => {
    try {
        const updated = await FormSubmission.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating form submission' });
    }
});

router.delete('/forms/:id', async (req, res) => {
    try {
        await FormSubmission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Submission deleted' });
        socket.getIO().emit('db_changed');
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
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error creating package' });
    }
});

router.post('/packages/seed', async (req, res) => {
    try {
        const presets = [
            // BASIC TRAINING
            { name: "FITNESS / WEIGHT TRAINING", category: "BASIC TRAINING PACKAGES", description: "Standard gym access and weight training.", price: 1000, duration: "1 Month", features: ["Gym Access", "Weight Training", "General Trainer Support"], isActive: true },
            { name: "FITNESS / WEIGHT TRAINING", category: "BASIC TRAINING PACKAGES", description: "Standard gym access and weight training for 3 months.", price: 2500, duration: "3 Months", features: ["Gym Access", "Weight Training", "General Trainer Support", "Diet Plan"], isActive: true },
            { name: "FITNESS / WEIGHT TRAINING", category: "BASIC TRAINING PACKAGES", description: "Standard gym access and weight training for 6 months.", price: 4500, duration: "6 Months", features: ["Gym Access", "Weight Training", "General Trainer Support", "Diet Plan"], isActive: true },
            { name: "FITNESS / WEIGHT TRAINING", category: "BASIC TRAINING PACKAGES", description: "Standard gym access and weight training for 1 year.", price: 8000, duration: "1 Year", features: ["Gym Access", "Weight Training", "General Trainer Support", "Diet Plan", "Free Steam Bath (2)"], isActive: true },
            { name: "CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Cardio and standard gym access.", price: 1500, duration: "1 Month", features: ["Gym Access", "Cardio Equipments", "Weight Training", "Diet Plan"], isActive: true },
            { name: "CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Cardio and standard gym access for 3 months.", price: 4000, duration: "3 Months", features: ["Gym Access", "Cardio Equipments", "Weight Training", "Diet Plan"], isActive: true },
            { name: "CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Cardio and standard gym access for 6 months.", price: 7500, duration: "6 Months", features: ["Gym Access", "Cardio Equipments", "Weight Training", "Diet Plan", "Free Steam Bath (2)"], isActive: true },
            { name: "CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Cardio and standard gym access for 1 year.", price: 14000, duration: "1 Year", features: ["Gym Access", "Cardio Equipments", "Weight Training", "Diet Plan", "Free Steam Bath (5)"], isActive: true },
            { name: "CROSSFIT + CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Complete package with Crossfit.", price: 2000, duration: "1 Month", features: ["Gym Access", "Crossfit", "Cardio Equipments", "Weight Training", "Diet Plan"], isActive: true },
            { name: "CROSSFIT + CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Complete package with Crossfit for 3 months.", price: 5500, duration: "3 Months", features: ["Gym Access", "Crossfit", "Cardio Equipments", "Weight Training", "Diet Plan"], isActive: true },
            { name: "CROSSFIT + CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Complete package with Crossfit for 6 months.", price: 10000, duration: "6 Months", features: ["Gym Access", "Crossfit", "Cardio Equipments", "Weight Training", "Diet Plan", "Free Steam Bath (2)"], isActive: true },
            { name: "CROSSFIT + CARDIO + FITNESS", category: "BASIC TRAINING PACKAGES", description: "Complete package with Crossfit for 1 year.", price: 18000, duration: "1 Year", features: ["Gym Access", "Crossfit", "Cardio Equipments", "Weight Training", "Diet Plan", "Free Steam Bath (5)"], isActive: true },
            
            // PERSONAL TRAINING
            { name: "ONLY STRENGTH", category: "PERSONAL TRAINING", description: "1 Month Personal Training - Only Strength", price: 3000, duration: "1 Month", features: ["Personalized Strength Training", "Equipment Guidance", "Form Correction"], isActive: true },
            { name: "STRENGTH + FITNESS", category: "PERSONAL TRAINING", description: "1 Month Personal Training - Strength & Fitness", price: 5000, duration: "1 Month", features: ["Strength Training", "Cardio & Fitness", "Equipment Guidance", "Form Correction", "Diet Tips"], isActive: true },
            { name: "ONLY STRENGTH", category: "PERSONAL TRAINING", description: "3 Months Personal Training - Only Strength", price: 7500, duration: "3 Months", features: ["Personalized Strength Training", "Equipment Guidance", "Form Correction", "Progress Tracking"], isActive: true },
            { name: "STRENGTH + FITNESS", category: "PERSONAL TRAINING", description: "3 Months Personal Training - Strength & Fitness", price: 12000, duration: "3 Months", features: ["Strength Training", "Cardio & Fitness", "Equipment Guidance", "Form Correction", "Diet Tips", "Progress Tracking"], isActive: true },
            
            // STEAM BATH
            { name: "STEAM BATH", category: "STEAM BATH", description: "Single session of Steam Bath", price: 200, duration: "1 Day", features: ["1 Steam Bath Session", "Locker Room Access", "Shower Access"], isActive: true },
            { name: "STEAM BATH", category: "STEAM BATH", description: "4 Days/Month Steam Bath limit 4 Sessions", price: 500, duration: "1 Month", features: ["4 Steam Bath Sessions", "Locker Room Access", "Shower Access", "Valid for 30 Days"], isActive: true },
            { name: "STEAM BATH", category: "STEAM BATH", description: "8 Days/Month Steam Bath limit 8 Sessions", price: 800, duration: "1 Month", features: ["8 Steam Bath Sessions", "Locker Room Access", "Shower Access", "Flexible Days"], isActive: true }
        ];

        let addedCount = 0;
        for (const p of presets) {
            const exists = await Package.findOne({ name: p.name, duration: p.duration, category: p.category });
            if (!exists) {
                await Package.create(p);
                addedCount++;
            }
        }
        res.json({ message: `Successfully loaded ${addedCount} default packages!` });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({ message: 'Error seeding default packages' });
    }
});

router.put('/packages/:id', async (req, res) => {
    try {
        const updated = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating package' });
    }
});

router.delete('/packages/:id', async (req, res) => {
    try {
        await Package.findByIdAndDelete(req.params.id);
        res.json({ message: 'Package deleted' });
        socket.getIO().emit('db_changed');
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
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error creating trainer' });
    }
});

router.put('/trainers/:id', async (req, res) => {
    try {
        const updated = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating trainer' });
    }
});

router.delete('/trainers/:id', async (req, res) => {
    try {
        await Trainer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Trainer deleted' });
        socket.getIO().emit('db_changed');
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
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error creating offer' });
    }
});

router.put('/offers/:id', async (req, res) => {
    try {
        const updated = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating offer' });
    }
});

router.delete('/offers/:id', async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
        socket.getIO().emit('db_changed');
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
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error adding image' });
    }
});

router.put('/gallery/:id', async (req, res) => {
    try {
        const updated = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating image' });
    }
});

router.delete('/gallery/:id', async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Image deleted' });
        socket.getIO().emit('db_changed');
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
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: 'Error updating content' });
    }
});

// ==========================================
// PAYMENTS MANAGEMENT
// ==========================================
router.get('/payments', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching payments' });
    }
});

router.put('/payments/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        const wasPending = !['manually_verified', 'cash_collected', 'auto_verified'].includes(payment.verificationStatus);
        const isApproved = ['manually_verified', 'cash_collected'].includes(req.body.verificationStatus);

        const updated = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (wasPending && isApproved) {
            const user = await User.findOne({ email: payment.email });
            if (user) {
                // Parse duration in days from planName / package
                const parseDurationDays = (name = '') => {
                    const n = name.toLowerCase();
                    if (n.includes('year')) {
                        const m = n.match(/(\d+)\s*year/);
                        return (m ? parseInt(m[1]) : 1) * 365;
                    } else if (n.includes('month')) {
                        const m = n.match(/(\d+)\s*month/);
                        return (m ? parseInt(m[1]) : 1) * 30;
                    } else if (n.includes('week')) {
                        const m = n.match(/(\d+)\s*week/);
                        return (m ? parseInt(m[1]) : 1) * 7;
                    } else if (n.includes('day')) {
                        const m = n.match(/(\d+)\s*day/);
                        return m ? parseInt(m[1]) : 30;
                    }
                    // Try to get duration from Package model
                    return 30;
                };

                let planDuration = 30;
                try {
                    const pkg = await Package.findOne({ name: payment.planName });
                    if (pkg && pkg.duration) {
                        planDuration = parseDurationDays(pkg.duration);
                    } else {
                        planDuration = parseDurationDays(payment.planName);
                    }
                } catch (e) {
                    planDuration = parseDurationDays(payment.planName);
                }

                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + planDuration);

                await Membership.create({
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    packageName: payment.planName,
                    planDuration,
                    amountPaid: payment.planPrice,
                    startDate,
                    endDate,
                });

                // Send confirmation receipt to user
                emailService.sendPaymentConfirmation({
                    name: user.name,
                    email: user.email,
                    packageName: payment.planName,
                    amountPaid: payment.planPrice,
                    startDate,
                    endDate,
                }).catch(console.error);

                whatsappService.sendPaymentConfirmation({
                    name: user.name,
                    email: user.email,
                    packageName: payment.planName,
                    amountPaid: payment.planPrice,
                    startDate,
                    endDate,
                }).catch(console.error);

                // Send approval alert to owner
                emailService.sendPaymentApprovedOwner({
                    userName: user.name,
                    email: user.email,
                    planName: payment.planName,
                    planPrice: payment.planPrice,
                    paymentMethod: payment.paymentMethod || 'upi',
                    startDate,
                    endDate,
                }).catch(console.error);
            }
        }

        res.json(updated);
        // Emit after membership creation so User Management reflects immediately
        socket.getIO().emit('db_changed', { type: 'membership_created' });
    } catch (err) {
        console.error('Admin payment update error:', err);
        res.status(500).json({ message: 'Error updating payment' });
    }
});

module.exports = router;
