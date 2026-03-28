/**
 * seedBasicTraining.js
 * Run with: node seedBasicTraining.js
 * Clears ALL existing BASIC TRAINING PACKAGES and seeds the new plan structure.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const newBasicTrainingPlans = [
    // DAILY
    { name: 'ONLY STRENGTH',          category: 'BASIC TRAINING PACKAGES', description: 'Daily strength training session.',              price: 75,   duration: '1 Day',    features: ['Gym Access', 'Weight Training', 'Locker Room'], isActive: true },
    { name: 'ONLY FITNESS',           category: 'BASIC TRAINING PACKAGES', description: 'Daily fitness & cardio session.',               price: 75,   duration: '1 Day',    features: ['Gym Access', 'Cardio Equipment', 'Locker Room'], isActive: true },
    { name: 'STRENGTH + FITNESS',     category: 'BASIC TRAINING PACKAGES', description: 'Daily combined strength and fitness session.', price: 150,  duration: '1 Day',    features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'Locker Room'], isActive: true },

    // MONTHLY
    { name: 'ONLY STRENGTH',          category: 'BASIC TRAINING PACKAGES', description: '1 Month strength training membership.',         price: 1000, duration: '1 Month',  features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Locker Room'], isActive: true },
    { name: 'STRENGTH + FITNESS',     category: 'BASIC TRAINING PACKAGES', description: '1 Month combined strength and fitness.',        price: 1500, duration: '1 Month',  features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Locker Room'], isActive: true },

    // 3 MONTHS
    { name: 'ONLY STRENGTH',          category: 'BASIC TRAINING PACKAGES', description: '3 Months strength training membership.',        price: 2500, duration: '3 Months', features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },
    { name: 'STRENGTH + FITNESS',     category: 'BASIC TRAINING PACKAGES', description: '3 Months combined strength and fitness.',       price: 3000, duration: '3 Months', features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },

    // 6 MONTHS
    { name: 'ONLY STRENGTH',          category: 'BASIC TRAINING PACKAGES', description: '6 Months strength training membership.',        price: 4000, duration: '6 Months', features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },
    { name: 'STRENGTH + FITNESS',     category: 'BASIC TRAINING PACKAGES', description: '6 Months combined strength and fitness.',       price: 5000, duration: '6 Months', features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Locker Room'], isActive: true },

    // YEARLY
    { name: 'ONLY STRENGTH',          category: 'BASIC TRAINING PACKAGES', description: '1 Year strength training membership.',          price: 7000, duration: '1 Year',   features: ['Gym Access', 'Weight Training', 'General Trainer Support', 'Diet Plan', 'Free Steam Bath (2)', 'Locker Room'], isActive: true },
    { name: 'STRENGTH + FITNESS',     category: 'BASIC TRAINING PACKAGES', description: '1 Year combined strength and fitness.',         price: 9000, duration: '1 Year',   features: ['Gym Access', 'Weight Training', 'Cardio Equipment', 'General Trainer Support', 'Diet Plan', 'Free Steam Bath (5)', 'Locker Room'], isActive: true },
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete all existing Basic Training plans
        const deleted = await Package.deleteMany({ category: 'BASIC TRAINING PACKAGES' });
        console.log(`🗑️  Deleted ${deleted.deletedCount} existing BASIC TRAINING PACKAGES plans`);

        // Insert new plans
        const inserted = await Package.insertMany(newBasicTrainingPlans);
        console.log(`✅ Inserted ${inserted.length} new BASIC TRAINING PACKAGES plans`);

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
