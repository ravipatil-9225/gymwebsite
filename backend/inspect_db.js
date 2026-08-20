require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Membership = require('./models/Membership');
const Payment = require('./models/Payment');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- ALL USERS ---');
        const users = await User.find({});
        for (const u of users) {
            console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Phone: ${u.phone}, Role: ${u.role}`);
        }

        console.log('\n--- ALL MEMBERSHIPS (Sorted by End Date Desc) ---');
        const memberships = await Membership.find({}).sort({ endDate: -1 });
        console.log(`Total memberships: ${memberships.length}`);
        for (const m of memberships) {
            console.log(`UserEmail: ${m.userEmail}, Package: ${m.packageName}, End: ${m.endDate}, Status: ${m.status}, ExpirySent: ${m.reminderExpirySent}, 3Sent: ${m.reminder3Sent}, 7Sent: ${m.reminder7Sent}`);
        }

        console.log('\n--- ALL PAYMENTS ---');
        const payments = await Payment.find({}).sort({ createdAt: -1 });
        for (const p of payments) {
            console.log(`Email: ${p.email}, Plan: ${p.planName}, Status: ${p.verificationStatus}, Created: ${p.createdAt}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
