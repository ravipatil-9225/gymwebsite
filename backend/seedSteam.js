require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const steamPlans = [
    {
        name: 'STEAM MAX. 30 MIN = 1 BATH',
        category: 'STEAM BATH',
        description: 'A single, refreshing 30-minute steam bath session to relax your muscles and rejuvenate your skin after an intense workout.',
        price: 150,
        duration: '1 Session',
        features: ['30 Minutes Max', 'Single Steam Bath Session', 'Muscle Relaxation'],
        isActive: true
    },
    {
        name: 'MONTHLY 4 BATHS',
        category: 'STEAM BATH',
        description: 'A monthly package including 4 dedicated steam bath sessions. Perfect for a weekly relaxation routine.',
        price: 500,
        duration: '1 Month',
        features: ['4 Steam Bath Sessions (30 Min Each)', 'Valid for 1 Month', 'Excellent Value'],
        isActive: true
    }
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing STEAM BATH plans just to be safe
        await Package.deleteMany({ category: 'STEAM BATH' });
        await Package.insertMany(steamPlans);
        console.log('✅ Inserted Steam Bath Plans');
    } catch (err) {
        console.error('❌ Error restoring Steam Bath data:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
