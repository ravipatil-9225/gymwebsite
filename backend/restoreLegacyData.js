require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');
const Trainer = require('./models/Trainer');
const Gallery = require('./models/Gallery');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const legacyPlans = [
    {
        name: 'Starter Trial Pass',
        category: 'BASIC TRAINING PACKAGES',
        description: 'Try out our gym for just ₹10! Get a full day of access to experience the gym environment, equipment, and our expert team before committing to a full plan.',
        price: 10,
        duration: '1 Day',
        features: ['1-day full gym access', 'Basic equipment orientation', 'Guided tour by our team'],
        isActive: true
    },
    {
        name: 'Bronze Beast Plan',
        category: 'BASIC TRAINING PACKAGES',
        description: 'Perfect for beginners starting their fitness journey. Get full access to hardcore strength training equipment and build your base strength.',
        price: 1000,
        duration: '1 Month',
        features: ['Hardcore workout area access', 'Strength training equipment', 'Gym environment & guidance'],
        isActive: true
    },
    {
        name: 'Silver Cardio Burn',
        category: 'BASIC TRAINING PACKAGES',
        description: 'Designed for people who want strength + fat burning workouts. Combine hardcore training with intense cardio sessions.',
        price: 1200,
        duration: '1 Month',
        features: ['Hardcore workout training', 'Cardio machines (treadmill, cycling, etc.)', 'Fat burning workout support'],
        isActive: true
    },
    {
        name: 'Gold Transformation Plan',
        category: 'BASIC TRAINING PACKAGES',
        description: 'A complete fitness experience with personal training guidance. Ideal for fast results and a fully structured workout plan.',
        price: 1500,
        duration: '1 Month',
        features: ['Hardcore training', 'Cardio training', 'Personal Trainer guidance', 'Personalized workout routine'],
        isActive: true
    },
    {
        name: 'Beast Mode',
        category: 'BASIC TRAINING PACKAGES',
        description: 'Commit to your fitness goals with a 3-month transformation program. Build consistency and noticeable results.',
        price: 3000,
        duration: '3 Months',
        features: ['Full gym access', 'Hardcore + Cardio training', 'Progress monitoring'],
        isActive: true
    },
    {
        name: 'Titan Strength Plan',
        category: 'BASIC TRAINING PACKAGES',
        description: 'For serious fitness enthusiasts ready for long-term muscle growth and endurance building.',
        price: 6000,
        duration: '6 Months',
        features: ['Full gym access', 'Strength & cardio training', 'Long-term fitness progress'],
        isActive: true
    },
    {
        name: 'Platinum Champion Plan',
        category: 'BASIC TRAINING PACKAGES',
        description: 'The ultimate fitness package for those who want complete body transformation and year-long commitment to health and strength.',
        price: 9000,
        duration: '1 Year',
        features: ['Unlimited gym access', 'Hardcore + Cardio training', 'Best value yearly membership'],
        isActive: true
    }
];

const legacyTrainers = [
    {
        name: 'Tara Parmar',
        specialization: 'Founder & Head Coach',
        experience: '10+ Years',
        certifications: 'Strength & Conditioning, Bodybuilding, Nutrition Planning',
        description: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.',
        photo: '/owner.jpg',
        instagramId: 'https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==',
        contact: ''
    },
    {
        name: 'Atharva Chavan',
        specialization: 'Elite Personal Trainer',
        experience: '5+ Years',
        certifications: 'HIIT, Functional Training, Mobility & Flexibility',
        description: 'Atharva specializes in high-intensity interval training, functional movement, and mobility. His dynamic approach keeps workouts challenging and highly effective.',
        photo: '/atharva.jpg',
        instagramId: 'https://www.instagram.com/_atharvachavan_?igsh=eW5oazR1ajBudzEy',
        contact: ''
    }
];

const legacyGallery = [
    { imageUrl: '/gallery/gym1.jpg', title: 'Aerial View', description: 'Tara Fitness Centre – Aerial View' },
    { imageUrl: '/gallery/gym2.jpg', title: 'Active Training Floor', description: 'Tara Fitness Centre – Active Floor' },
    { imageUrl: '/gallery/gym3.jpg', title: 'State-of-the-Art Equipment', description: 'Tara Fitness Centre – Equipment' },
    { imageUrl: '/gallery/gym4.jpg', title: 'Full Gym Interior', description: 'Tara Fitness Centre – Interior' },
    { imageUrl: '/gallery/gym5.jpg', title: 'Our Facility', description: 'Tara Fitness Centre – Building Exterior' }
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Restore Plans (Wipe ONLY BASIC TRAINING PACKAGES to keep PT & Steam Bath)
        await Package.deleteMany({ category: 'BASIC TRAINING PACKAGES' });
        await Package.insertMany(legacyPlans);
        console.log('✅ Restored original 7 Membership Plans under BASIC TRAINING PACKAGES');

        // 2. Restore Trainers (Wipe all)
        await Trainer.deleteMany({});
        await Trainer.insertMany(legacyTrainers);
        console.log('✅ Restored original 2 Trainers');

        // 3. Restore Gallery
        const existsGallery = await Gallery.countDocuments();
        if (existsGallery === 0) {
            await Gallery.insertMany(legacyGallery);
            console.log('✅ Migrated original 5 Gallery photos into Database');
        } else {
            console.log('ℹ️ Gallery already has photos, skipping seed.');
        }

    } catch (err) {
        console.error('❌ Error restoring legacy data:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

run();
