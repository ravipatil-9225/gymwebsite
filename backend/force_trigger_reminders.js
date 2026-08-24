require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Payment = require('./models/Payment');
const notificationEmitter = require('./events/notificationEmitter');
require('./services/notificationEngine'); // Ensure listeners are active

async function forceTriggerReminders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        console.log('Fetching active users (excluding admins)...');
        const users = await User.find({ role: 'user' }).populate('latestMembership');
        
        let overdueCount = 0;
        let expiryCount = 0;
        let expiredCount = 0;
        let pendingPaymentCount = 0;

        for (const user of users) {
            // 1. Check for Overdue Pay-Later Payments
            const overduePayments = await Payment.find({
                email: user.email,
                verificationStatus: 'pending', // standard pending is pay-later
                paymentMethod: 'pay_later'
            });

            for (const payment of overduePayments) {
                // If it's been pending for more than a day, let's remind them
                const paymentDate = new Date(payment.createdAt);
                if (paymentDate < yesterday) {
                    notificationEmitter.emit('membership_overdue_reminder', {
                        user,
                        reminderData: { name: user.name, email: user.email, planName: payment.planName }
                    });
                    overdueCount++;
                }
            }
            
            // 2. Check for Cash Pending Payments
            const cashPendingPayments = await Payment.find({
                email: user.email,
                verificationStatus: 'cash_pending'
            });
            
            for (const payment of cashPendingPayments) {
                const paymentDate = new Date(payment.createdAt);
                if (paymentDate < yesterday) {
                     notificationEmitter.emit('cash_payment_request', {
                         user,
                         paymentData: { planName: payment.planName, amount: payment.planPrice || payment.amount },
                         documentUrl: null
                     });
                     pendingPaymentCount++;
                }
            }

            // 3. Check for Membership Expiry and Expired
            const membership = user.latestMembership;
            if (membership && membership.endDate) {
                const endDate = new Date(membership.endDate);
                endDate.setHours(0, 0, 0, 0);

                const diffTime = endDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 3 || diffDays === 7) {
                    notificationEmitter.emit('membership_expiry_reminder', {
                        user,
                        reminderData: { name: user.name, email: user.email, planName: membership.packageName, daysLeft: diffDays }
                    });
                    expiryCount++;
                } else if (diffDays === -1) {
                    // Expired yesterday
                    notificationEmitter.emit('membership_expired', {
                        user,
                        reminderData: { name: user.name, email: user.email, planName: membership.packageName }
                    });
                    expiredCount++;
                }
            }
            
            // Sleep slightly to prevent event spam
            await new Promise(r => setTimeout(r, 100));
        }

        console.log('\n--- Trigger Summary ---');
        console.log(`Overdue Reminders Triggered: ${overdueCount}`);
        console.log(`Cash Pending Reminders Triggered: ${pendingPaymentCount}`);
        console.log(`Expiry Reminders (3/7 days) Triggered: ${expiryCount}`);
        console.log(`Expired Alerts (Yesterday) Triggered: ${expiredCount}`);
        console.log('-----------------------');
        
        // Wait a few seconds for the notification engine to finish emitting
        console.log('Waiting 5 seconds for messages to dispatch to WhatsApp Meta API...');
        await new Promise(r => setTimeout(r, 5000));
        
    } catch (err) {
        console.error('Error in force script:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

forceTriggerReminders();
