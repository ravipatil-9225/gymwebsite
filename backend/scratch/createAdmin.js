require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym-website';

async function createOrUpdateAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'tarafitness365@gmail.com';
        const password = 'TFC@2412';

        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log('User found. Updating password and ensuring admin role...');
            user.password = password;
            user.role = 'admin';
            await user.save();
            console.log('User updated successfully.');
        } else {
            console.log('User not found. Creating new admin user...');
            user = await User.create({
                name: 'Tara Fitness Admin',
                email: email.toLowerCase(),
                password: password,
                role: 'admin',
                phone: '9999999999',
                dob: '1990-01-01'
            });
            console.log('Admin user created successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

createOrUpdateAdmin();
