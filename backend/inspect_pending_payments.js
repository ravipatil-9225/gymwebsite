require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- PENDING/OVERDUE PAYMENTS ---');
        const payments = await Payment.find({
            verificationStatus: { $in: ['pending', 'overdue', 'cash_pending'] }
        });
        console.log(`Found ${payments.length} pending/overdue payments.`);
        for (const p of payments) {
            console.log(`ID: ${p._id} | Email: ${p.email} | Plan: ${p.planName} | Price: ${p.planPrice} | Method: ${p.paymentMethod} | Status: ${p.verificationStatus} | ExpiryDate: ${p.expiryDate}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
