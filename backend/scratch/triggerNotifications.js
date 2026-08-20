require('dotenv').config();
const mongoose = require('mongoose');

// Import notification engine so event listeners are registered
require('../services/notificationEngine');

const { runMembershipReminderLogic } = require('../cron/membershipReminder');
const { runPaymentMonitorLogic } = require('../cron/paymentMonitor');

async function trigger() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        console.log('\n--- 1. Running Overdue Payment & Expiry Monitor ---');
        await runPaymentMonitorLogic();

        console.log('\n--- 2. Running Membership Expiry Reminder Logic ---');
        await runMembershipReminderLogic();

        console.log('\n🎉 Finished running all live checks.');
    } catch (err) {
        console.error('❌ Error triggering checks:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

trigger();
