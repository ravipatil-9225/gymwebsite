const mongoose = require('mongoose');
const Package = require('./models/Package');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym-website';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        
        const packages = [
            {
                name: "1 BATH",
                category: "STEAM BATH",
                description: "Single Steam Bath Session (Max. 30 Min)",
                price: 150,
                duration: "Other", // So it shows under "Other Plans" if not exactly 1 Day etc. Or I can use '1 Day'
                features: ["1 Steam Bath Session", "Max 30 Minutes"],
                isActive: true
            },
            {
                name: "MONTHLY 4 BATHS",
                category: "STEAM BATH",
                description: "4 Steam Bath Sessions in a Month (Max. 30 Min each)",
                price: 500,
                duration: "1 Month",
                features: ["4 Steam Bath Sessions", "Max 30 Minutes per session", "Valid for 1 Month"],
                isActive: true
            }
        ];

        try {
            await Package.insertMany(packages);
            console.log('Inserted steam bath packages successfully!');
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
