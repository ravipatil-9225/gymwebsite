/**
 * seedTrainers.js
 * Run with: node seedTrainers.js
 * Seeds default gym trainers (only adds if none exist, or if --force flag is used).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Trainer = require('./models/Trainer');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const defaultTrainers = [
    {
        name: 'Tara Parmar',
        specialization: 'Strength & Conditioning, Bodybuilding',
        experience: '10+ Years',
        certifications: 'Founder & Head Coach, ACE Certified',
        description: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.',
        photo: '/atharva.jpg',
        instagram: 'https://www.instagram.com/tara_parmar',
        contact: '+91 9876543210'
    },
    {
        name: 'Rahul Desai',
        specialization: 'CrossFit, HIIT, Fat Loss',
        experience: '6 Years',
        certifications: 'CrossFit Level 1, ISSA Certified Fitness Trainer',
        description: 'Rahul specializes in high-intensity functional training and fat loss programs. His dynamic workouts are designed to push your limits.',
        photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=400',
        instagram: 'https://www.instagram.com/rahul_fitness',
        contact: '+91 9876543211'
    },
    {
        name: 'Priya Sharma',
        specialization: 'Yoga, Pilates, Flexibility',
        experience: '8 Years',
        certifications: 'RYT 500 Yoga Alliance, Stott Pilates',
        description: 'Priya brings a calm and focused approach to fitness. Her sessions emphasize core strength, flexibility, and mind-body connection.',
        photo: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&h=400',
        instagram: 'https://www.instagram.com/priya_yoga',
        contact: '+91 9876543212'
    },
    {
        name: 'Vikram Singh',
        specialization: 'Powerlifting, Functional Training',
        experience: '5 Years',
        certifications: 'NSCA CSCS, Kettlebell Level 2',
        description: 'Vikram is dedicated to building raw strength and improving functional movement mechanics. His coaching ensures you get stronger safely.',
        photo: 'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&h=400',
        instagram: 'https://www.instagram.com/vikram_lifts',
        contact: '+91 9876543213'
    }
];

async function run() {
    const force = process.argv.includes('--force');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const existing = await Trainer.countDocuments();
        if (existing > 0 && !force) {
            console.log(`ℹ️  ${existing} trainer(s) already exist. Use --force to overwrite.`);
        } else {
            if (force) {
                await Trainer.deleteMany({});
                console.log('🗑️  Cleared all existing trainers');
            }
            const inserted = await Trainer.insertMany(defaultTrainers);
            console.log(`✅ Inserted ${inserted.length} default trainers`);
            inserted.forEach(t => console.log(`  ✓ ${t.name} — ${t.specialization}`));
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
