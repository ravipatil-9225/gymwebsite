require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

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
    { name: 'STRENGTH + FITNESS', category: 'BASIC TRAINING PACKAGES', description: 'A full year of unlimited access to transform your entire life.', price: 9000, duration: '1 Year', features: ['1 Year complete access', 'Strength & Cardio training', 'Ultimate Value plan'], isActive: true },
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await Package.deleteMany({ category: 'BASIC TRAINING PACKAGES' });
        await Package.insertMany(newBasicPlans);
        console.log('✅ Replaced Basic Training Plans completely!');
    } catch (err) {
        console.error('❌ Error updating data:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
