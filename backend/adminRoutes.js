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
const { deleteFromCloudinary } = require('./utils/imageHandler');

// Protect all admin routes
router.use(verifyAdmin);

// ==========================================
// SYSTEM RESTORE
// ==========================================
router.post('/system/restore-legacy', async (req, res) => {
    try {
        const legacyPlans = [
            { name: 'Starter Trial Pass', category: 'BASIC TRAINING PACKAGES', description: 'Try out our gym for just ₹10! Get a full day of access to experience the gym environment, equipment, and our expert team before committing to a full plan.', price: 10, duration: '1 Day', features: ['1-day full gym access', 'Basic equipment orientation', 'Guided tour by our team'], isActive: true },
            { name: 'Bronze Beast Plan', category: 'BASIC TRAINING PACKAGES', description: 'Perfect for beginners starting their fitness journey. Get full access to hardcore strength training equipment and build your base strength.', price: 1000, duration: '1 Month', features: ['Hardcore workout area access', 'Strength training equipment', 'Gym environment & guidance'], isActive: true },
            { name: 'Silver Cardio Burn', category: 'BASIC TRAINING PACKAGES', description: 'Designed for people who want strength + fat burning workouts. Combine hardcore training with intense cardio sessions.', price: 1200, duration: '1 Month', features: ['Hardcore workout training', 'Cardio machines (treadmill, cycling, etc.)', 'Fat burning workout support'], isActive: true },
            { name: 'Gold Transformation Plan', category: 'BASIC TRAINING PACKAGES', description: 'A complete fitness experience with personal training guidance. Ideal for fast results and a fully structured workout plan.', price: 1500, duration: '1 Month', features: ['Hardcore training', 'Cardio training', 'Personal Trainer guidance', 'Personalized workout routine'], isActive: true },
            { name: 'Beast Mode', category: 'BASIC TRAINING PACKAGES', description: 'Commit to your fitness goals with a 3-month transformation program. Build consistency and noticeable results.', price: 3000, duration: '3 Months', features: ['Full gym access', 'Hardcore + Cardio training', 'Progress monitoring'], isActive: true },
            { name: 'Titan Strength Plan', category: 'BASIC TRAINING PACKAGES', description: 'For serious fitness enthusiasts ready for long-term muscle growth and endurance building.', price: 6000, duration: '6 Months', features: ['Full gym access', 'Strength & cardio training', 'Long-term fitness progress'], isActive: true },
            { name: 'Platinum Champion Plan', category: 'BASIC TRAINING PACKAGES', description: 'The ultimate fitness package for those who want complete body transformation and year-long commitment to health and strength.', price: 9000, duration: '1 Year', features: ['Unlimited gym access', 'Hardcore + Cardio training', 'Best value yearly membership'], isActive: true }
        ];

        const legacyTrainers = [
            { name: 'Tara Parmar', specialization: 'Founder & Head Coach', experience: '10+ Years', certifications: 'Strength & Conditioning, Bodybuilding, Nutrition Planning', description: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.', photo: '/owner.jpg', instagramId: 'https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==', contact: '' },
            { name: 'Atharva Chavan', specialization: 'Elite Personal Trainer', experience: '5+ Years', certifications: 'HIIT, Functional Training, Mobility & Flexibility', description: 'Atharva specializes in high-intensity interval training, functional movement, and mobility. His dynamic approach keeps workouts challenging and highly effective.', photo: '/atharva.jpg', instagramId: 'https://www.instagram.com/_atharvachavan_?igsh=eW5oazR1ajBudzEy', contact: '' }
        ];

        const legacyGallery = [
            { imageUrl: '/gallery/gym1.jpg', title: 'Aerial View', description: 'Tara Fitness Centre – Aerial View' },
            { imageUrl: '/gallery/gym2.jpg', title: 'Active Training Floor', description: 'Tara Fitness Centre – Active Floor' },
            { imageUrl: '/gallery/gym3.jpg', title: 'State-of-the-Art Equipment', description: 'Tara Fitness Centre – Equipment' },
            { imageUrl: '/gallery/gym4.jpg', title: 'Full Gym Interior', description: 'Tara Fitness Centre – Interior' },
            { imageUrl: '/gallery/gym5.jpg', title: 'Our Facility', description: 'Tara Fitness Centre – Building Exterior' }
        ];

        // 1. Restore Plans ONLY if BASIC TRAINING is empty to avoid double adding
        const btnCount = await Package.countDocuments({ category: 'BASIC TRAINING PACKAGES' });
        if (btnCount === 0) {
            await Package.insertMany(legacyPlans);
        }

        // 2. Restore Trainers ONLY if Empty
        const trCount = await Trainer.countDocuments();
        if (trCount === 0) {
            await Trainer.insertMany(legacyTrainers);
        }

        // 3. Restore Gallery ONLY if Empty
        const glCount = await Gallery.countDocuments();
        if (glCount === 0) {
            await Gallery.insertMany(legacyGallery);
        }

        socket.getIO().emit('db_changed');
        res.json({ message: 'Legacy setup complete! The production DB is populated.' });
    } catch (err) {
        res.status(500).json({ message: 'Error restoring data' });
    }
});

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
// DYNAMIC SUMMARY DASHBOARD
// ==========================================
router.get('/summary', async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }

        const yearInt = parseInt(year);
        const monthInt = parseInt(month);

        const startDate = new Date(yearInt, monthInt - 1, 1);
        const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);

        // A. New Members
        const newMembers = await User.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).select('name email phone createdAt role').sort({ createdAt: -1 });

        // B. Subscriptions
        const subscriptions = await Membership.find({
            startDate: { $gte: startDate, $lte: endDate }
        }).sort({ startDate: -1 });

        // C. Expirations
        const expirations = await Membership.find({
            endDate: { $gte: startDate, $lte: endDate }
        }).sort({ endDate: -1 });

        res.json({
            newMembersCount: newMembers.length,
            subscriptionsCount: subscriptions.length,
            expirationsCount: expirations.length,
            newMembers,
            subscriptions,
            expirations,
            period: { month: monthInt, year: yearInt }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching summary data' });
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

router.post('/users', async (req, res) => {
    try {
        const { name, email, phone, dob, password, role } = req.body;
        if(!name || !email || !phone || !dob || !password) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const newUser = new User({ name, email, phone, dob, password, role: role || 'user' });
        await newUser.save();

        res.status(201).json({ message: "User created successfully", user: { _id: newUser._id, name, email, role } });
        socket.getIO().emit('db_changed');
    } catch (err) {
        res.status(500).json({ message: err.message || 'Error creating user' });
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
        const user = await User.findById(req.params.id);
        if (user && user.profileImage && user.profileImage.public_id) {
            await deleteFromCloudinary(user.profileImage.public_id);
        }
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
        const { category } = req.body; // optional: if passed, only seed that category

        const presets = [
            // BASIC TRAINING PACKAGES (new plan structure)
            { name: 'ONLY STRENGTH',      category: 'BASIC TRAINING PACKAGES', description: 'Daily strength training session.',              price: 75,   duration: '1 Day',    features: ['Gym Access', 'Weight Training', 'Locker Room'], isActive: true },
            { name: 'ONLY FITNESS',       category: 'BASIC TRAINING PACKAGES', description: 'Daily fitness & cardio session.',               price: 75,   duration: '1 Day',    features: ['Gym Access', 'Cardio Equipment', 'Locker Room'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'Daily combined strength and fitness session.',  price: 150,  duration: '1 Day',    features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'Locker Room'], isActive: true },

            { name: 'ONLY STRENGTH',      category: 'BASIC TRAINING PACKAGES', description: '1 Month strength training membership.',         price: 1000, duration: '1 Month',  features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Locker Room'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: '1 Month combined strength and fitness.',        price: 1500, duration: '1 Month',  features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Locker Room'], isActive: true },

            { name: 'ONLY STRENGTH',      category: 'BASIC TRAINING PACKAGES', description: '3 Months strength training membership.',        price: 2500, duration: '3 Months', features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: '3 Months combined strength and fitness.',       price: 3000, duration: '3 Months', features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },

            { name: 'ONLY STRENGTH',      category: 'BASIC TRAINING PACKAGES', description: '6 Months strength training membership.',        price: 4000, duration: '6 Months', features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: '6 Months combined strength and fitness.',       price: 5000, duration: '6 Months', features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },

            { name: 'ONLY STRENGTH',      category: 'BASIC TRAINING PACKAGES', description: '1 Year strength training membership.',          price: 7000, duration: '1 Year',   features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Free Steam Bath (2)', 'Locker Room'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: '1 Year combined strength and fitness.',         price: 9000, duration: '1 Year',   features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Free Steam Bath (5)', 'Locker Room'], isActive: true },

            // PERSONAL TRAINING
            { name: 'ONLY STRENGTH',      category: 'PERSONAL TRAINING', description: '1 Month Personal Training - Only Strength',           price: 3000,  duration: '1 Month',  features: ['Personalized Strength Training', 'Equipment Guidance', 'Form Correction'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'PERSONAL TRAINING', description: '1 Month Personal Training - Strength & Fitness',      price: 5000,  duration: '1 Month',  features: ['Strength Training', 'Cardio & Fitness', 'Equipment Guidance', 'Form Correction', 'Diet Tips'], isActive: true },
            { name: 'ONLY STRENGTH',      category: 'PERSONAL TRAINING', description: '3 Months Personal Training - Only Strength',          price: 7500,  duration: '3 Months', features: ['Personalized Strength Training', 'Equipment Guidance', 'Form Correction', 'Progress Tracking'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'PERSONAL TRAINING', description: '3 Months Personal Training - Strength & Fitness',     price: 12000, duration: '3 Months', features: ['Strength Training', 'Cardio & Fitness', 'Equipment Guidance', 'Form Correction', 'Diet Tips', 'Progress Tracking'], isActive: true },

            // STEAM BATH
            { name: '1 BATH',          category: 'STEAM BATH', description: 'Single Steam Bath session — max 30 minutes.',            price: 150, duration: '1 Day',   features: ['1 Steam Bath Session', 'Max 30 Minutes', 'Locker Room Access', 'Shower Access'], isActive: true },
            { name: 'MONTHLY 4 BATHS', category: 'STEAM BATH', description: 'Monthly Steam Bath pack — 4 sessions, max 30 min each.', price: 500, duration: '1 Month', features: ['4 Steam Bath Sessions', 'Max 30 Minutes Each', 'Locker Room Access', 'Shower Access', 'Valid for 30 Days'], isActive: true }
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

// Reset a specific category: delete all plans in that category, then re-seed from official list
router.post('/packages/reset-category', async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) return res.status(400).json({ message: 'category is required' });

        const OFFICIAL_PLANS = {
            'BASIC TRAINING PACKAGES': [
                { name: 'ONLY STRENGTH',      description: 'Daily strength training session.',             price: 75,   duration: '1 Day',    features: ['Gym Access', 'Weight Training', 'Locker Room'] },
                { name: 'ONLY FITNESS',       description: 'Daily fitness & cardio session.',              price: 75,   duration: '1 Day',    features: ['Gym Access', 'Cardio Equipment', 'Locker Room'] },
                { name: 'STRENGTH + FITNESS', description: 'Daily combined strength and fitness session.', price: 150,  duration: '1 Day',    features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'Locker Room'] },
                { name: 'ONLY STRENGTH',      description: '1 Month strength training membership.',        price: 1000, duration: '1 Month',  features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Locker Room'] },
                { name: 'STRENGTH + FITNESS', description: '1 Month combined strength and fitness.',       price: 1500, duration: '1 Month',  features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Locker Room'] },
                { name: 'ONLY STRENGTH',      description: '3 Months strength training membership.',       price: 2500, duration: '3 Months', features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Locker Room'] },
                { name: 'STRENGTH + FITNESS', description: '3 Months combined strength and fitness.',      price: 3000, duration: '3 Months', features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Locker Room'] },
                { name: 'ONLY STRENGTH',      description: '6 Months strength training membership.',       price: 4000, duration: '6 Months', features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Locker Room'] },
                { name: 'STRENGTH + FITNESS', description: '6 Months combined strength and fitness.',      price: 5000, duration: '6 Months', features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Locker Room'] },
                { name: 'ONLY STRENGTH',      description: '1 Year strength training membership.',         price: 7000, duration: '1 Year',   features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Free Steam Bath (2)', 'Locker Room'] },
                { name: 'STRENGTH + FITNESS', description: '1 Year combined strength and fitness.',        price: 9000, duration: '1 Year',   features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Free Steam Bath (5)', 'Locker Room'] },
            ],
            'PERSONAL TRAINING': [
                { name: 'ONLY STRENGTH',      description: '1 Month Personal Training - Only Strength',       price: 3000,  duration: '1 Month',  features: ['Personalized Strength Training', 'Equipment Guidance', 'Form Correction', 'Progress Tracking'] },
                { name: 'STRENGTH + FITNESS', description: '1 Month Personal Training - Strength & Fitness',  price: 5000,  duration: '1 Month',  features: ['Strength Training', 'Cardio & Fitness', 'Equipment Guidance', 'Form Correction', 'Diet Tips', 'Progress Tracking'] },
                { name: 'ONLY STRENGTH',      description: '3 Months Personal Training - Only Strength',      price: 7500,  duration: '3 Months', features: ['Personalized Strength Training', 'Equipment Guidance', 'Form Correction', 'Progress Tracking', 'Diet Plan'] },
                { name: 'STRENGTH + FITNESS', description: '3 Months Personal Training - Strength & Fitness', price: 12000, duration: '3 Months', features: ['Strength Training', 'Cardio & Fitness', 'Equipment Guidance', 'Form Correction', 'Diet Tips', 'Progress Tracking', 'Diet Plan'] },
            ],
            'STEAM BATH': [
                { name: '1 BATH',          description: 'Single Steam Bath session — max 30 minutes.',            price: 150, duration: '1 Day',   features: ['1 Steam Bath Session', 'Max 30 Minutes', 'Locker Room Access', 'Shower Access'] },
                { name: 'MONTHLY 4 BATHS', description: 'Monthly Steam Bath pack — 4 sessions, max 30 min each.', price: 500, duration: '1 Month', features: ['4 Steam Bath Sessions', 'Max 30 Minutes Each', 'Locker Room Access', 'Shower Access', 'Valid for 30 Days'] },
            ]
        };

        const plans = OFFICIAL_PLANS[category];
        if (!plans) return res.status(400).json({ message: `No official plans defined for: ${category}` });

        const deleted = await Package.deleteMany({ category });
        const inserted = await Package.insertMany(plans.map(p => ({ ...p, category, isActive: true })));
        res.json({ message: `Reset complete! Deleted ${deleted.deletedCount}, inserted ${inserted.length} plans for "${category}".` });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Reset category error:', err);
        res.status(500).json({ message: 'Error resetting category' });
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

router.post('/trainers/seed', async (req, res) => {
    try {
        const defaultTrainers = [
            { name: 'Tara Parmar', specialization: 'Strength & Conditioning, Bodybuilding', experience: '10+ Years', certifications: 'Founder & Head Coach, ACE Certified', description: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.', photo: '/atharva.jpg', instagram: 'https://www.instagram.com/tara_parmar', contact: '+91 9876543210' },
            { name: 'Rahul Desai', specialization: 'CrossFit, HIIT, Fat Loss', experience: '6 Years', certifications: 'CrossFit Level 1, ISSA Certified Fitness Trainer', description: 'Rahul specializes in high-intensity functional training and fat loss programs. His dynamic workouts are designed to push your limits.', photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=400', instagram: 'https://www.instagram.com/rahul_fitness', contact: '+91 9876543211' },
            { name: 'Priya Sharma', specialization: 'Yoga, Pilates, Flexibility', experience: '8 Years', certifications: 'RYT 500 Yoga Alliance, Stott Pilates', description: 'Priya brings a calm and focused approach to fitness. Her sessions emphasize core strength, flexibility, and mind-body connection.', photo: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&h=400', instagram: 'https://www.instagram.com/priya_yoga', contact: '+91 9876543212' },
            { name: 'Vikram Singh', specialization: 'Powerlifting, Functional Training', experience: '5 Years', certifications: 'NSCA CSCS, Kettlebell Level 2', description: 'Vikram is dedicated to building raw strength and improving functional movement mechanics. His coaching ensures you get stronger safely.', photo: 'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&h=400', instagram: 'https://www.instagram.com/vikram_lifts', contact: '+91 9876543213' }
        ];

        let addedCount = 0;
        for (const t of defaultTrainers) {
            const exists = await Trainer.findOne({ name: t.name });
            if (!exists) {
                await Trainer.create(t);
                addedCount++;
            }
        }
        res.json({ message: `Successfully loaded ${addedCount} default trainers!` });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({ message: 'Error seeding default trainers' });
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

router.post('/offers/seed', async (req, res) => {
    try {
        const monthsFromNow = (n) => {
            const d = new Date();
            d.setMonth(d.getMonth() + n);
            return d;
        };

        const defaultOffers = [
            {
                title: 'New Member Welcome Offer',
                description: 'Brand new to the gym? Join this month and get your first month at a discounted rate. Includes full gym access, locker room, and a free orientation session with our trainer.',
                discount: '20% OFF',
                expiryDate: monthsFromNow(3),
                isActive: true,
            },
            {
                title: 'Yearly Membership Special',
                description: 'Commit to your fitness for a full year and save big! Get 2 free Steam Bath sessions and a personalised diet consultation included with any yearly plan.',
                discount: '15% OFF',
                expiryDate: monthsFromNow(2),
                isActive: true,
            },
            {
                title: 'Bring a Friend — Refer & Save',
                description: 'Refer a friend who joins as a new member and both of you get ₹500 off your next renewal. No limit on referrals — the more you refer, the more you save!',
                discount: '₹500 OFF',
                expiryDate: monthsFromNow(4),
                isActive: true,
            },
            {
                title: 'Student Discount',
                description: 'Are you a student? Show your valid student ID at the reception and avail exclusive discounts on all monthly and quarterly membership plans.',
                discount: '10% OFF',
                expiryDate: monthsFromNow(6),
                isActive: true,
            },
            {
                title: 'Steam Bath Monthly Pack',
                description: 'Relax and recover with our Steam Bath Monthly Pack. Get 4 sessions (max 30 min each) at a special bundled price. Perfect complement to your workout routine.',
                discount: 'Special Price',
                expiryDate: monthsFromNow(2),
                isActive: true,
            },
        ];

        let addedCount = 0;
        for (const o of defaultOffers) {
            const exists = await Offer.findOne({ title: o.title });
            if (!exists) {
                await Offer.create(o);
                addedCount++;
            }
        }
        res.json({ message: `Successfully loaded ${addedCount} default offers!` });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Seed error:', err);
        res.status(500).json({ message: 'Error seeding default offers' });
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
router.put('/payments/:id/apply-discount', async (req, res) => {
    try {
        const { discount, discountType } = req.body;
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (['auto_verified', 'manually_verified', 'cash_collected'].includes(payment.verificationStatus)) {
            return res.status(400).json({ message: 'Payment already verified. Cannot apply discount.' });
        }

        const originalAmount = payment.originalAmount || payment.planPrice;
        let finalAmount = originalAmount;

        if (discountType === 'percentage') {
            finalAmount = Math.round(originalAmount - (originalAmount * discount / 100));
        } else if (discountType === 'flat') {
            finalAmount = Math.round(originalAmount - discount);
        }

        if (finalAmount < 0) finalAmount = 0;

        const updated = await Payment.findByIdAndUpdate(req.params.id, {
            originalAmount, discount, discountType, finalAmount, planPrice: finalAmount
        }, { new: true });

        res.json({ message: 'Discount applied', payment: updated });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Admin discount apply error:', err);
        res.status(500).json({ message: 'Error applying discount' });
    }
});

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

router.delete('/payments/:id', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (payment && payment.screenshot && payment.screenshot.public_id) {
            await deleteFromCloudinary(payment.screenshot.public_id);
        }
        await Payment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Payment deleted successfully' });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Admin payment delete error:', err);
        res.status(500).json({ message: 'Error deleting payment' });
    }
});

module.exports = router;
