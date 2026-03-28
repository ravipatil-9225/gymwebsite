/**
 * seedOffers.js
 * Run with: node seedOffers.js
 * Seeds default gym offers (only adds if none exist, or if --force flag is used).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Offer = require('./models/Offer');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Expiry helpers
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

async function run() {
    const force = process.argv.includes('--force');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const existing = await Offer.countDocuments();
        if (existing > 0 && !force) {
            console.log(`ℹ️  ${existing} offer(s) already exist. Use --force to overwrite.`);
        } else {
            if (force) {
                await Offer.deleteMany({});
                console.log('🗑️  Cleared all existing offers');
            }
            const inserted = await Offer.insertMany(defaultOffers);
            console.log(`✅ Inserted ${inserted.length} default offers`);
            inserted.forEach(o => console.log(`  ✓ ${o.title} — ${o.discount}`));
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
