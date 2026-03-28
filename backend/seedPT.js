require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const ptPlans = [
    {
        name: 'ONLY STRENGTH',
        category: 'PERSONAL TRAINING',
        description: 'Dedicated personal training focusing solely on high-intensity strength and muscle building.',
        price: 3000,
        duration: '1 Month',
        features: ['1-on-1 Personal Trainer', 'Custom Strength Routine', 'Progress Tracking'],
        isActive: true
    },
    {
        name: 'STRENGTH + FITNESS',
        category: 'PERSONAL TRAINING',
        description: 'Comprehensive personal training combining intense strength workouts with cardio endurance.',
        price: 5000,
        duration: '1 Month',
        features: ['1-on-1 Personal Trainer', 'Strength & Cardio Plan', 'Dietary Guidelines'],
        isActive: true
    },
    {
        name: 'ONLY STRENGTH',
        category: 'PERSONAL TRAINING',
        description: 'Our 3-month strength program gives you the structured personal coaching you need for visible muscle growth.',
        price: 7500,
        duration: '3 Months',
        features: ['1-on-1 Personal Trainer', 'Advanced Strength Routine', 'Form Correction'],
        isActive: true
    },
    {
        name: 'STRENGTH + FITNESS',
        category: 'PERSONAL TRAINING',
        description: 'The ultimate 3-month transformation package. Dedicated coaching for full-body strength and peak cardiovascular fitness.',
        price: 12000,
        duration: '3 Months',
        features: ['1-on-1 Personal Trainer', 'Complete Transformation Plan', 'Diet & Lifestyle Coaching'],
        isActive: true
    }
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing PT plans just to be safe
        await Package.deleteMany({ category: 'PERSONAL TRAINING' });
        await Package.insertMany(ptPlans);
        console.log('✅ Inserted Personal Training Plans');
    } catch (err) {
        console.error('❌ Error restoring PT data:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
