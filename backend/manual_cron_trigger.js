require('dotenv').config();
const mongoose = require('mongoose');
const { runMembershipReminderLogic } = require('./cron/membershipReminder');
const { runPaymentMonitorLogic } = require('./cron/paymentMonitor');
require('./services/notificationEngine'); // Start listener

async function triggerAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('--- Triggering Overdue & Expiry Reminders ---');
        await runPaymentMonitorLogic();
        await runMembershipReminderLogic();
        
        console.log('Wait a few seconds for background emitters to process...');
        await new Promise(r => setTimeout(r, 5000));
        
        console.log('All real-time catch-up logic has been executed successfully.');
    } catch (err) {
        console.error('Error during manual trigger:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

triggerAll();
