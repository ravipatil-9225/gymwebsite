require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Filter out users whose plans are expired
    // We get the latest membership for each user and see if it is expired
    const allUsers = await User.find({ role: 'user' });
    const expiredUsers = [];
    const goingToExpireUsers = [];

    for (const user of allUsers) {
        // Find latest membership for this user
        const latestMembership = await Membership.findOne({ userId: user._id })
            .sort({ endDate: -1 });

        if (!latestMembership) {
            expiredUsers.push({
                name: user.name,
                email: user.email,
                phone: user.phone,
                packageName: 'No Membership assigned',
                endDate: 'N/A',
                reason: 'No membership record found'
            });
            continue;
        }

        const endDate = new Date(latestMembership.endDate);

        if (latestMembership.status === 'expired' || endDate < now) {
            expiredUsers.push({
                name: user.name,
                email: user.email,
                phone: user.phone,
                packageName: latestMembership.packageName,
                endDate: endDate.toLocaleDateString(),
                reason: `Expired on ${endDate.toLocaleDateString()}`
            });
        } else if (latestMembership.status === 'active' && endDate >= now && endDate <= sevenDaysFromNow) {
            const diffTime = Math.abs(endDate - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            goingToExpireUsers.push({
                name: user.name,
                email: user.email,
                phone: user.phone,
                packageName: latestMembership.packageName,
                endDate: endDate.toLocaleDateString(),
                daysRemaining: diffDays
            });
        }
    }

    // 2. Filter out users whose payment is pending
    // We look at the Payment collection for any pending or cash_pending payments
    const pendingPayments = await Payment.find({
        verificationStatus: { $in: ['pending', 'cash_pending', 'overdue'] }
    }).sort({ createdAt: -1 });

    const pendingPaymentUsers = pendingPayments.map(p => ({
        name: p.userName,
        email: p.email,
        planName: p.planName,
        price: p.planPrice,
        paymentMethod: p.paymentMethod,
        status: p.verificationStatus,
        date: new Date(p.createdAt).toLocaleDateString()
    }));

    // Output formatting
    console.log('\n========================================================================');
    console.log(`📊 LIVE GYM SYSTEM REPORT (Local Time: ${new Date().toLocaleString()})`);
    console.log('========================================================================');

    console.log(`\n❌ [1] EXPIRED PLANS / NO PLANS (${expiredUsers.length} Users)`);
    console.log('------------------------------------------------------------------------');
    if (expiredUsers.length === 0) {
        console.log('No expired users.');
    } else {
        expiredUsers.forEach((u, i) => {
            console.log(`${i+1}. ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Plan: ${u.packageName} | EndDate: ${u.endDate} (${u.reason})`);
        });
    }

    console.log(`\n⏳ [2] GOING TO EXPIRE IN NEXT 7 DAYS (${goingToExpireUsers.length} Users)`);
    console.log('------------------------------------------------------------------------');
    if (goingToExpireUsers.length === 0) {
        console.log('No memberships expiring in the next 7 days.');
    } else {
        goingToExpireUsers.forEach((u, i) => {
            console.log(`${i+1}. ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Plan: ${u.packageName} | Expires: ${u.endDate} (${u.daysRemaining} days left)`);
        });
    }

    console.log(`\n💳 [3] PENDING PAYMENTS (${pendingPaymentUsers.length} Payments)`);
    console.log('------------------------------------------------------------------------');
    if (pendingPaymentUsers.length === 0) {
        console.log('No pending payments.');
    } else {
        pendingPaymentUsers.forEach((p, i) => {
            console.log(`${i+1}. ${p.name} | Email: ${p.email} | Plan: ${p.planName} | Price: ${p.price} | Method: ${p.paymentMethod} | Status: ${p.status} | Initiated: ${p.date}`);
        });
    }

    console.log('========================================================================\n');

    await mongoose.disconnect();
}

main().catch(console.error);
