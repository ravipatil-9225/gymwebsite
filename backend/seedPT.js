const mongoose = require('mongoose');
const Package = require('./models/Package');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym-website';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        
        const packages = [
            {
                name: "ONLY STRENGTH",
                category: "PERSONAL TRAINING",
                description: "1 Month Personal Training - Only Strength",
                price: 3000,
                duration: "1 Month",
                features: ["Personalized Strength Training", "Equipment Guidance", "Form Correction"],
                isActive: true
            },
            {
                name: "STRENGTH + FITNESS",
                category: "PERSONAL TRAINING",
                description: "1 Month Personal Training - Strength & Fitness",
                price: 5000,
                duration: "1 Month",
                features: ["Strength Training", "Cardio & Fitness", "Equipment Guidance", "Form Correction", "Diet Tips"],
                isActive: true
            },
            {
                name: "ONLY STRENGTH",
                category: "PERSONAL TRAINING",
                description: "3 Months Personal Training - Only Strength",
                price: 7500,
                duration: "3 Months",
                features: ["Personalized Strength Training", "Equipment Guidance", "Form Correction", "Progress Tracking"],
                isActive: true
            },
            {
                name: "STRENGTH + FITNESS",
                category: "PERSONAL TRAINING",
                description: "3 Months Personal Training - Strength & Fitness",
                price: 12000,
                duration: "3 Months",
                features: ["Strength Training", "Cardio & Fitness", "Equipment Guidance", "Form Correction", "Diet Tips", "Progress Tracking"],
                isActive: true
            }
        ];

        try {
            await Package.insertMany(packages);
            console.log('Inserted personal training packages successfully!');
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('DB Connection error:', err);
        process.exit(1);
    });
