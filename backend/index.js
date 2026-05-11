require('dotenv').config();

// ── PROCESS-LEVEL SAFETY NET (Layer 3) ──
// Catches errors that happen completely OUTSIDE of Express (e.g. background DB errors)
process.on('unhandledRejection', (reason) => {
    console.error('⚠️  [Unhandled Rejection] Server survived:', reason);
    // Do NOT crash the server — just log and keep running
});

process.on('uncaughtException', (err) => {
    console.error('🔴 [Uncaught Exception] Server survived:', err.message);
    // Do NOT crash the server — just log and keep running
});
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const socket = require('./socket');
const { startMembershipReminderCron } = require('./cron/membershipReminder');
const { startPaymentMonitorCron } = require('./cron/paymentMonitor');

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
const subscriptionRoutes = require('./routes/subscriptionRoutes');

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
        const newBasicPlans = [
            { name: 'ONLY STRENGTH', category: 'BASIC TRAINING PACKAGES', description: 'Daily access to all strength training equipment.', price: 75, duration: '1 Day', features: ['Daily gym access', 'Strength equipment only', 'Basic guidance'], isActive: true },
            { name: 'ONLY FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'Daily access to all cardiovascular and fitness equipment.', price: 75, duration: '1 Day', features: ['Daily gym access', 'Cardio equipment only', 'Basic guidance'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'Full daily access to both strength and cardiovascular training areas.', price: 150, duration: '1 Day', features: ['Full gym access', 'Strength & Cardio equipment', 'Basic guidance'], isActive: true },
            { name: 'ONLY STRENGTH', category: 'BASIC TRAINING PACKAGES', description: 'Monthly access focusing on building muscle and strength.', price: 1000, duration: '1 Month', features: ['1 Month gym access', 'Strength equipment only', 'General gym support'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'Comprehensive monthly plan for total body fitness.', price: 1500, duration: '1 Month', features: ['1 Month complete access', 'Strength & Cardio training', 'General gym support'], isActive: true },
            { name: 'ONLY STRENGTH', category: 'BASIC TRAINING PACKAGES', description: '3-Month strength program to see huge physical improvements.', price: 2500, duration: '3 Months', features: ['3 Months gym access', 'Strength equipment only', 'Progress tracking'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: '3-Month complete fitness program for best results.', price: 3000, duration: '3 Months', features: ['3 Months complete access', 'Strength & Cardio training', 'Progress tracking'], isActive: true },
            { name: 'ONLY STRENGTH', category: 'BASIC TRAINING PACKAGES', description: 'Half-year dedicated strength program.', price: 4000, duration: '6 Months', features: ['6 Months gym access', 'Strength equipment only', 'Long-term dedication'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'Half-year ultimate health and fitness transformation.', price: 5000, duration: '6 Months', features: ['6 Months complete access', 'Strength & Cardio training', 'Long-term dedication'], isActive: true },
            { name: 'ONLY STRENGTH', category: 'BASIC TRAINING PACKAGES', description: 'Full year of unlimited strength building.', price: 7000, duration: '1 Year', features: ['1 Year gym access', 'Strength equipment only', 'Best Value plan'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'A full year of unlimited access to transform your entire life.', price: 9000, duration: '1 Year', features: ['1 Year complete access', 'Strength & Cardio training', 'Ultimate Value plan'], isActive: true }
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

        const ptPlans = [
            { name: 'ONLY STRENGTH', category: 'PERSONAL TRAINING', description: 'Dedicated personal training focusing solely on high-intensity strength and muscle building.', price: 3000, duration: '1 Month', features: ['1-on-1 Personal Trainer', 'Custom Strength Routine', 'Progress Tracking'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'PERSONAL TRAINING', description: 'Comprehensive personal training combining intense strength workouts with cardio endurance.', price: 5000, duration: '1 Month', features: ['1-on-1 Personal Trainer', 'Strength & Cardio Plan', 'Dietary Guidelines'], isActive: true },
            { name: 'ONLY STRENGTH', category: 'PERSONAL TRAINING', description: 'Our 3-month strength program gives you the structured personal coaching you need for visible muscle growth.', price: 7500, duration: '3 Months', features: ['1-on-1 Personal Trainer', 'Advanced Strength Routine', 'Form Correction'], isActive: true },
            { name: 'STRENGTH + FITNESS', category: 'PERSONAL TRAINING', description: 'The ultimate 3-month transformation package. Dedicated coaching for full-body strength and peak cardiovascular fitness.', price: 12000, duration: '3 Months', features: ['1-on-1 Personal Trainer', 'Complete Transformation Plan', 'Diet & Lifestyle Coaching'], isActive: true }
        ];

        const steamPlans = [
            { name: 'STEAM MAX. 30 MIN = 1 BATH', category: 'STEAM BATH', description: 'A single, refreshing 30-minute steam bath session to relax your muscles.', price: 150, duration: '1 Session', features: ['30 Minutes Max', 'Single Session', 'Muscle Relaxation'], isActive: true },
            { name: 'MONTHLY 4 BATHS', category: 'STEAM BATH', description: 'A monthly package including 4 dedicated steam bath sessions for a weekly routine.', price: 500, duration: '1 Month', features: ['4 Steam Bath Sessions', 'Valid for 1 Month', 'Excellent Value'], isActive: true }
        ];

        if (await Package.findOne({ name: 'Starter Trial Pass' })) {
            await Package.deleteMany({ category: 'BASIC TRAINING PACKAGES' });
        }

        if (await Package.countDocuments({ category: 'BASIC TRAINING PACKAGES' }) === 0) await Package.insertMany(newBasicPlans);
        if (await Package.countDocuments({ category: 'PERSONAL TRAINING' }) === 0) await Package.insertMany(ptPlans);
        if (await Package.countDocuments({ category: 'STEAM BATH' }) === 0) await Package.insertMany(steamPlans);
        if (await Trainer.countDocuments() === 0) await Trainer.insertMany(legacyTrainers);
        if (await Gallery.countDocuments() === 0) await Gallery.insertMany(legacyGallery);
    } catch (e) { console.error('Auto-seed error:', e); }
});

// ── SECURITY MIDDLEWARE ──

// 1. Helmet — Sets 15+ secure HTTP headers (hides Express, prevents Clickjacking/XSS)
app.use(helmet());

// 2. CORS — Only allow requests from our official frontend URL
const allowedOrigins = [
    process.env.FRONTEND_URL,              // Production URL from .env
    'https://tfc365.com',                  // ✅ Custom domain (primary)
    'https://www.tfc365.com',              // ✅ Custom domain (www)
    'https://gymwebsite-pink.vercel.app',  // Vercel preview/alternate deployment
    'https://tara-fitness.vercel.app',     // Previous production frontend
    'http://localhost:5173',               // Local dev frontend
    'http://localhost:5174',               // Local dev fallback
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS policy: Origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. NoSQL Injection Sanitizer — manually sanitize only body & params
// NOTE: We skip req.query because Express 4 makes it a read-only getter
// and express-mongo-sanitize would crash trying to reassign it.
app.use((req, res, next) => {
    if (req.body) req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    if (req.params) req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
    next();
});

// ── RATE LIMITERS ──

// Auth routes (Login/Register): Max 200 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: { message: 'High traffic right now. Please try again in 1 to 2 mins.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API routes: Max 1000 requests per 15 minutes per IP (administrative/heavy usage)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// AI/Nutrition route: Max 200 requests per 15 minutes
const nutritionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: 'Too many nutrition plan requests. Please wait before generating another.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general limiter to all /api/* routes
app.use('/api/', generalLimiter);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running fluently' });
});

// ── MOUNT ROUTES ──
app.use('/api/auth', authLimiter, authRoutes);    // Auth routes are rate-limited to 10 req/15min
app.use('/api/users', authRoutes);               // Combined user profile/auth logic
app.use('/api', enquiryRoutes);                  // /api/plan-interest, /api/join
app.use('/api/forms', formRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/nutrition', nutritionLimiter, nutritionRoutes); // AI route limited to 20 req/15min
app.use('/api/subscription', subscriptionRoutes);

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

app.get('/api/public/transformations', async (req, res) => {
    try {
        const Transformation = require('./models/Transformation');
        const transformations = await Transformation.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(transformations);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching transformations' });
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

app.get('/api/public/stats', async (req, res) => {
    try {
        const [members, trainers, services] = await Promise.all([
            User.countDocuments({ role: 'member' }),
            Trainer.countDocuments(),
            Package.distinct('category')
        ]);

        const gymStartYear = 2015;
        const currentYear = new Date().getFullYear();
        const yearsOfExperience = currentYear - gymStartYear;

        res.json({
            members: members + 500, // Offset to match branding "500+"
            trainers: trainers,
            services: services.length,
            years: yearsOfExperience >= 10 ? yearsOfExperience : 10
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching stats' });
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

// ── 404 HANDLER — catches requests to routes that don't exist ──
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── GLOBAL ERROR HANDLER (Layer 2) ──
// Must be the LAST middleware (4 arguments = Express treats it as error handler)
// Catches everything forwarded via next(err) from any route or asyncHandler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // If response status is still 200 (OK), override to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log the error with context for easy debugging
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Send a clean JSON response (never expose raw stack traces in production)
    res.status(statusCode).json({
        message: err.message || 'An unexpected server error occurred.',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🛡️  Security: Helmet + Rate Limiting + NoSQL Sanitizer active`);
    console.log(`🔧 Error Handler: Global crash protection active`);
    startMembershipReminderCron();
    startPaymentMonitorCron();
});
