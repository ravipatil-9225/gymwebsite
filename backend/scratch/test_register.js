require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Let's print the existing indexes first
        const indexes = await User.collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        // Create test user 1
        console.log('Creating Test User 1...');
        const user1 = new User({
            name: 'Test One',
            email: `testone_${Date.now()}@gmail.com`,
            password: 'password123',
            phone: '9876543210',
            dob: '1995-01-01'
        });
        await user1.save();
        console.log('Test User 1 created:', user1._id, 'biometricCardId:', user1.biometricCardId);

        // Create test user 2
        console.log('Creating Test User 2...');
        const user2 = new User({
            name: 'Test Two',
            email: `testtwo_${Date.now()}@gmail.com`,
            password: 'password123',
            phone: '9876543211',
            dob: '1995-01-02'
        });
        await user2.save();
        console.log('Test User 2 created:', user2._id, 'biometricCardId:', user2.biometricCardId);

        // Clean up
        await User.deleteOne({ _id: user1._id });
        await User.deleteOne({ _id: user2._id });
        console.log('Cleaned up test users');

    } catch (err) {
        console.error('Registration test failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
