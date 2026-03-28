/**
 * seedPersonalTraining.js
 * Run with: node seedPersonalTraining.js
 * Clears ALL existing PERSONAL TRAINING packages and seeds the new plan structure.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const newPersonalTrainingPlans = [
    // MONTHLY
    {
        name: 'ONLY STRENGTH',
        category: 'PERSONAL TRAINING',
        description: '1 Month Personal Training – Only Strength',
        price: 3000,
        duration: '1 Month',
        features: ['Personalized Strength Training', 'Equipment Guidance', 'Form Correction', 'Progress Tracking'],
        isActive: true
    },
    {
        name: 'STRENGTH + FITNESS',
        category: 'PERSONAL TRAINING',
        description: '1 Month Personal Training – Strength & Fitness',
        price: 5000,
        duration: '1 Month',
        features: ['Strength Training', 'Cardio & Fitness', 'Equipment Guidance', 'Form Correction', 'Diet Tips', 'Progress Tracking'],
        isActive: true
    },

    // 3 MONTHS
    {
        name: 'ONLY STRENGTH',
        category: 'PERSONAL TRAINING',
        description: '3 Months Personal Training – Only Strength',
        price: 7500,
        duration: '3 Months',
        features: ['Personalized Strength Training', 'Equipment Guidance', 'Form Correction', 'Progress Tracking', 'Diet Plan'],
        isActive: true
    },
    {
        name: 'STRENGTH + FITNESS',
        category: 'PERSONAL TRAINING',
        description: '3 Months Personal Training – Strength & Fitness',
        price: 12000,
        duration: '3 Months',
        features: ['Strength Training', 'Cardio & Fitness', 'Equipment Guidance', 'Form Correction', 'Diet Tips', 'Progress Tracking', 'Diet Plan'],
        isActive: true
    },
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const deleted = await Package.deleteMany({ category: 'PERSONAL TRAINING' });
        console.log(`🗑️  Deleted ${deleted.deletedCount} existing PERSONAL TRAINING plans`);

        const inserted = await Package.insertMany(newPersonalTrainingPlans);
        console.log(`✅ Inserted ${inserted.length} new PERSONAL TRAINING plans`);

        console.log('\nNew plans:');
        inserted.forEach(p => console.log(`  [${p.duration}] ${p.name} — ₹${p.price}`));
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

run();
