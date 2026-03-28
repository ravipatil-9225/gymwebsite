const mongoose = require('mongoose');
const Payment = require('../models/Payment');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym-website';
        const conn = await mongoose.connect(uri, {
            // Options are no longer needed in Mongoose 6+, but keeping connection clean
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Force sync indexes in production so schema updates (e.g., sparse: true) work cleanly
        if (process.env.NODE_ENV === 'production' || true) {
            try {
                await Payment.syncIndexes();
                console.log('Payment indexes synced successfully.');
            } catch (err) {
                console.error('Failed to sync Payment indexes:', err.message);
            }
        }
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
