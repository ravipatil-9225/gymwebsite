require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- ALL USERS IN DB ---');
        const users = await User.find({});
        console.log(`Total users: ${users.length}`);
        for (const u of users) {
            console.log(`Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Role: ${u.role} | Created: ${u.createdAt}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
