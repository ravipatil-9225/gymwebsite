/**
 * seedSteamBath.js
 * Run with: node seedSteamBath.js
 * Clears ALL existing STEAM BATH packages and seeds the new plan structure.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const newSteamBathPlans = [
    {
        name: '1 BATH',
        category: 'STEAM BATH',
        description: 'Single Steam Bath session — max 30 minutes.',
        price: 150,
        duration: '1 Day',
        features: ['1 Steam Bath Session', 'Max 30 Minutes', 'Locker Room Access', 'Shower Access'],
        isActive: true,
    },
    {
        name: 'MONTHLY 4 BATHS',
        category: 'STEAM BATH',
        description: 'Monthly Steam Bath pack — 4 sessions, max 30 min each.',
        price: 500,
        duration: '1 Month',
        features: ['4 Steam Bath Sessions', 'Max 30 Minutes Each', 'Locker Room Access', 'Shower Access', 'Valid for 30 Days'],
        isActive: true,
    },
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const deleted = await Package.deleteMany({ category: 'STEAM BATH' });
        console.log(`🗑️  Deleted ${deleted.deletedCount} existing STEAM BATH plans`);

        const inserted = await Package.insertMany(newSteamBathPlans);
        console.log(`✅ Inserted ${inserted.length} new STEAM BATH plans`);

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
