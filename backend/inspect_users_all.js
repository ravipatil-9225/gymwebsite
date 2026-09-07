require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach((u, i) => {
        console.log(`${i+1}. Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Role: ${u.role}`);
    });
    await mongoose.disconnect();
}
run();
