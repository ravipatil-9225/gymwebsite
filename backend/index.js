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
connectDB();

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
