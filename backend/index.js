require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');

const connectDB = require('./config/db');
const socket = require('./socket');
const { startMembershipReminderCron } = require('./cron/membershipReminder');

// Models (for public routes and admin triggers)
const User = require('./models/User');
const Membership = require('./models/Membership');
const Trainer = require('./models/Trainer');
const Package = require('./models/Package');
const Offer = require('./models/Offer');
const Gallery = require('./models/Gallery');
const Content = require('./models/Content');

// Routes
const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const formRoutes = require('./routes/formRoutes');
const adminRoutes = require('./adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');

// Services
const emailService = require('./services/emailService');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const httpServer = http.createServer(app);
socket.init(httpServer);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
// Connect to MongoDB & Auto-Initialize Deployed Empty Databases
connectDB().then(async () => {
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

        if (await Package.countDocuments({ category: 'BASIC TRAINING PACKAGES' }) === 0) await Package.insertMany(legacyPlans);
        if (await Trainer.countDocuments() === 0) await Trainer.insertMany(legacyTrainers);
        if (await Gallery.countDocuments() === 0) await Gallery.insertMany(legacyGallery);
    } catch (e) { console.error('Auto-seed error:', e); }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running fluently' });
});

// ── MOUNT ROUTES ──
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes); // Combined user profile/auth logic
app.use('/api', enquiryRoutes);    // /api/plan-interest, /api/join
app.use('/api/forms', formRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/nutrition', nutritionRoutes);

// ── PUBLIC CONTENT ROUTES ──
app.get('/api/public/trainers', async (req, res) => {
    try {
        const trainers = await Trainer.find().sort({ createdAt: -1 });
        res.json(trainers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching trainers' });
    }
});

app.get('/api/public/packages', async (req, res) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.json(packages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching packages' });
    }
});

app.get('/api/public/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
});

app.get('/api/public/gallery', async (req, res) => {
    try {
        const gallery = await Gallery.find().sort({ createdAt: -1 });
        res.json(gallery);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching gallery' });
    }
});

app.get('/api/public/content/:section', async (req, res) => {
    try {
        const content = await Content.findOne({ section: req.params.section });
        res.json(content || { data: {} });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching content' });
    }
});

app.get('/api/public/reviews', async (req, res) => {
    try {
        const FormSubmission = require('./models/FormSubmission');
        const reviews = await FormSubmission.find({ 
            type: 'feedback', 
            rating: { $gte: 4 } 
        }).sort({ createdAt: -1 }).limit(50);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

app.get('/api/public/all-feedbacks', async (req, res) => {
    try {
        const FormSubmission = require('./models/FormSubmission');
        const feedbacks = await FormSubmission.find({ type: 'feedback' })
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedbacks' });
    }
});

// ── PAYMENT CONFIRMATION (Admin triggers) ──
app.post('/api/admin/confirm-payment', protect, async (req, res) => {
    try {
        const { userId, packageName, amountPaid, durationDays } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (durationDays || 30));

        const membership = await Membership.create({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            packageName,
            amountPaid,
            startDate,
            endDate,
        });

        emailService.sendPaymentConfirmation({
            name: user.name,
            email: user.email,
            packageName,
            amountPaid,
            startDate,
            endDate,
        }).catch(console.error);

        socket.getIO().emit('db_changed');
        res.json({ success: true, membership });
    } catch (err) {
        console.error('Payment confirmation error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startMembershipReminderCron();
});
// trigger restart
