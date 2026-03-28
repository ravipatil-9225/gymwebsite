const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Package = require('../models/Package');

dotenv.config({ path: '../.env' }); // Adjust depending on run location

const newPackages = [
    // DAILY
    { name: 'Strength Only', category: 'BASIC TRAINING PACKAGES', description: 'Daily pass for strength / weight training', price: 75, duration: '1 Day', features: ['Gym Access', 'Weight Training Area'] },
    { name: 'Fitness Only', category: 'BASIC TRAINING PACKAGES', description: 'Daily pass for cardio / fitness training', price: 75, duration: '1 Day', features: ['Cardio Equipment', 'Stretching Area'] },
    { name: 'Strength + Fitness', category: 'BASIC TRAINING PACKAGES', description: 'Full day pass for all gym areas', price: 150, duration: '1 Day', features: ['Gym Access', 'Cardio Equipment', 'Weight Training Area'] },

    // MONTHLY
    { name: 'Strength Only (1 Month)', category: 'BASIC TRAINING PACKAGES', description: 'Monthly strength training pass', price: 1000, duration: '1 Month', features: ['Gym Access', 'Weight Training Area'] },
    { name: 'Strength + Fitness (1 Month)', category: 'BASIC TRAINING PACKAGES', description: 'Monthly full access pass', price: 1500, duration: '1 Month', features: ['Gym Access', 'Cardio Equipment', 'Weight Training Area'] },

    // 3 MONTHS
    { name: 'Strength Only (3 Months)', category: 'BASIC TRAINING PACKAGES', description: '3 months strength training pass', price: 2500, duration: '3 Months', features: ['Gym Access', 'Weight Training Area'] },
    { name: 'Strength + Fitness (3 Months)', category: 'BASIC TRAINING PACKAGES', description: '3 months full access pass', price: 3000, duration: '3 Months', features: ['Gym Access', 'Cardio Equipment', 'Weight Training Area'] },

    // 6 MONTHS
    { name: 'Strength Only (6 Months)', category: 'BASIC TRAINING PACKAGES', description: '6 months strength training pass', price: 4000, duration: '6 Months', features: ['Gym Access', 'Weight Training Area'] },
    { name: 'Strength + Fitness (6 Months)', category: 'BASIC TRAINING PACKAGES', description: '6 months full access pass', price: 5000, duration: '6 Months', features: ['Gym Access', 'Cardio Equipment', 'Weight Training Area'] },

    // YEARLY
    { name: 'Strength Only (Yearly)', category: 'BASIC TRAINING PACKAGES', description: 'Annual strength training pass', price: 7000, duration: '1 Year', features: ['Gym Access', 'Weight Training Area'] },
    { name: 'Strength + Fitness (Yearly)', category: 'BASIC TRAINING PACKAGES', description: 'Annual full access pass', price: 9000, duration: '1 Year', features: ['Gym Access', 'Cardio Equipment', 'Weight Training Area'] }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        await Package.deleteMany({});
        console.log('Cleared existing packages');

        await Package.insertMany(newPackages);
        console.log('Inserted new packages successfully!');

        process.exit(0);
    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
}

seed();
