require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Membership = require('./models/Membership');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const testPhone = '9699169574';
        const phoneRegex = new RegExp(testPhone);

        // Find users matching phone
        console.log('\n--- USERS WITH PHONE 9699169574 OR EMAILS bb/cc ---');
        const users = await User.find({
            $or: [
                { phone: phoneRegex },
                { email: /bb@gmail\.com/i },
                { email: /cc@gmail\.com/i }
            ]
        });

        const userEmails = users.map(u => u.email);
        const userIds = users.map(u => u._id);

        for (const u of users) {
            console.log(`User: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Role: ${u.role}`);
        }

        console.log('\n--- MEMBERSHIPS FOR THESE USERS ---');
        const memberships = await Membership.find({
            $or: [
                { userId: { $in: userIds } },
                { userEmail: { $in: userEmails } }
            ]
        });
        console.log(`Found ${memberships.length} memberships.`);
        for (const m of memberships) {
            console.log(`UserEmail: ${m.userEmail} | Package: ${m.packageName} | Start: ${m.startDate} | End: ${m.endDate} | Status: ${m.status}`);
        }

        console.log('\n--- SUBSCRIPTIONS FOR THESE USERS ---');
        const subscriptions = await Subscription.find({
            userId: { $in: userIds }
        });
        console.log(`Found ${subscriptions.length} subscriptions.`);
        for (const s of subscriptions) {
            console.log(`UserId: ${s.userId} | Plan: ${s.planName} | Start: ${s.startDate} | End: ${s.endDate} | Status: ${s.status}`);
        }

        console.log('\n--- PAYMENTS FOR THESE USERS ---');
        const payments = await Payment.find({
            $or: [
                { email: { $in: userEmails } },
                { userName: { $in: users.map(u => u.name) } }
            ]
        });
        console.log(`Found ${payments.length} payments.`);
        for (const p of payments) {
            console.log(`Email: ${p.email} | Plan: ${p.planName} | Method: ${p.paymentMethod} | Status: ${p.verificationStatus} | ExpiryDate: ${p.expiryDate} | Created: ${p.createdAt}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
