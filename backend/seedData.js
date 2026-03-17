/**
 * Seed Script for Tara Fitness Centre
 * Run: node seedData.js
 * This populates the database with initial data if collections are empty.
 * It will NOT overwrite existing data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trainer = require('./models/Trainer');
const Package = require('./models/Package');
const Offer = require('./models/Offer');
const Gallery = require('./models/Gallery');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym-website';

// ─────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────

const trainersData = [
    {
        name: 'Tara Parmar',
        specialization: 'Strength & Conditioning, Bodybuilding, Nutrition Planning',
        experience: '10+ Years',
        certifications: 'Founder & Head Coach',
        description: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.',
        instagramId: 'https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==',
        contact: '',
        photo: '/owner.jpg'
    },
    {
        name: 'Atharva Chavan',
        specialization: 'HIIT, Functional Training, Mobility & Flexibility',
        experience: '5+ Years',
        certifications: 'Elite Personal Trainer',
        description: 'Atharva specializes in high-intensity interval training, functional movement, and mobility. His dynamic approach keeps workouts challenging and highly effective.',
        instagramId: 'https://www.instagram.com/_atharvachavan_?igsh=eW5oazR1ajBudzEy',
        contact: '',
        photo: '/atharva.jpg'
    }
];


const packagesData = [
    {
        name: 'Starter Pack',
        description: 'Perfect for beginners looking to start their fitness journey. Includes full gym access and one free orientation session.',
        price: 999,
        duration: '1 Month',
        features: [
            'Full Gym Access (6 AM – 10 PM)',
            '1 Free Orientation Session',
            'Access to Cardio & Weight Areas',
            'Locker Room Access'
        ],
        isActive: true
    },
    {
        name: 'Monthly Plan',
        description: 'Our most popular plan for consistent gym-goers who want unlimited access and group classes.',
        price: 1499,
        duration: '1 Month',
        features: [
            'Unlimited Gym Access',
            'All Group Classes Included',
            'Free Body Composition Analysis',
            'Access to All Equipment',
            'Locker Room & Towel Service'
        ],
        isActive: true
    },
    {
        name: 'Quarterly Plan',
        description: 'Commit to 3 months and save! Ideal for those serious about achieving visible results.',
        price: 3999,
        duration: '3 Months',
        features: [
            'Unlimited Gym Access',
            'All Group Classes Included',
            '1 Free PT Session Per Month',
            'Monthly Progress Check-in',
            'Priority Booking for Classes',
            'Locker Room & Towel Service'
        ],
        isActive: true
    },
    {
        name: 'Half Yearly Plan',
        description: 'Six months of dedication with added perks including nutrition guidance and personal training sessions.',
        price: 6999,
        duration: '6 Months',
        features: [
            'Unlimited Gym Access',
            'All Group Classes Included',
            '2 Free PT Sessions Per Month',
            'Nutrition Consultation',
            'Monthly Progress Report',
            'Priority Booking for Classes',
            'Guest Pass (once a month)',
            'Locker Room & Towel Service'
        ],
        isActive: true
    },
    {
        name: 'Annual Elite',
        description: 'Our best value plan for the truly committed. Get the full Tara Fitness experience for a full year.',
        price: 11999,
        duration: '1 Year',
        features: [
            'Unlimited Gym Access (24/7)',
            'All Group Classes Included',
            '4 Free PT Sessions Per Month',
            'Full Nutrition Plan',
            'Quarterly Body Composition Analysis',
            'Priority Booking for All Classes',
            'Guest Pass (twice a month)',
            'Free Tara Fitness Merchandise',
            'Locker Room & Towel Service'
        ],
        isActive: true
    }
];

const offersData = [
    {
        title: 'New Year Kickstart – 30% Off',
        description: 'Start the new year strong! Get 30% off on any membership plan when you sign up this month. No joining fee included.',
        discount: '30%',
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        image: ''
    },
    {
        title: 'Refer a Friend & Get Free Month',
        description: 'Refer a friend to Tara Fitness and both of you get one free month added to your membership. Valid for existing and new members.',
        discount: '1 Month Free',
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        image: ''
    },
    {
        title: 'Student Discount – 20% Off',
        description: 'Show your valid student ID and avail a flat 20% discount on Monthly and Quarterly plans. Invest in your health while studying!',
        discount: '20%',
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        image: ''
    },
    {
        title: 'Couple Fitness Deal',
        description: 'Sign up together and save! Couples get access to exclusive duo training sessions and a combined 25% off on any plan.',
        discount: '25%',
        expiryDate: new Date('2026-12-31'),
        isActive: true,
        image: ''
    }
];

const galleryData = [
    {
        imageUrl: '/gallery/gym1.jpg',
        title: 'Tara Fitness Centre – Aerial View',
        category: 'Gym',
        isActive: true
    },
    {
        imageUrl: '/gallery/gym2.jpg',
        title: 'Active Training Floor',
        category: 'Gym',
        isActive: true
    },
    {
        imageUrl: '/gallery/gym3.jpg',
        title: 'State-of-the-Art Equipment',
        category: 'Gym',
        isActive: true
    },
    {
        imageUrl: '/gallery/gym4.jpg',
        title: 'Full Gym Interior',
        category: 'Gym',
        isActive: true
    },
    {
        imageUrl: '/gallery/gym5.jpg',
        title: 'Our Facility',
        category: 'Gym',
        isActive: true
    }
];

// ─────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────

async function seedCollection(Model, data, name) {
    const count = await Model.countDocuments();
    if (count > 0) {
        console.log(`✅ ${name}: Already has ${count} records — skipping.`);
        return;
    }
    await Model.insertMany(data);
    console.log(`🌱 ${name}: Inserted ${data.length} records.`);
}

async function main() {
    console.log('\n=== Tara Fitness Centre — Database Seeder ===\n');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📦 Connected to MongoDB:', MONGO_URI, '\n');

        await seedCollection(Trainer, trainersData, 'Trainers');
        await seedCollection(Package, packagesData, 'Packages');
        await seedCollection(Offer, offersData, 'Offers');
        await seedCollection(Gallery, galleryData, 'Gallery');

        console.log('\n✅ Seeding complete!\n');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();
