require('dotenv').config();
const mongoose = require('mongoose');
const notificationEmitter = require('./events/notificationEmitter');
require('./services/notificationEngine');
const NotificationLog = require('./models/NotificationLog');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const dummyUser = {
            _id: new mongoose.Types.ObjectId(),
            name: "Test User",
            email: "test@example.com",
            phone: process.env.WHATSAPP_TEST_NUMBER || "919876543210" 
            // Use your own phone number here if testing actually
        };

        console.log('\n--- Emitting payment_confirmed event ---');
        notificationEmitter.emit('payment_confirmed', {
            user: dummyUser,
            paymentData: {
                planName: 'Test Strength Plan',
                amount: 1500,
                startDate: '01/01/2026',
                endDate: '01/02/2026'
            },
            documentUrl: null
        });

        // Wait a few seconds to let background job run
        await new Promise(res => setTimeout(res, 5000));

        const logs = await NotificationLog.find({ userId: dummyUser._id }).sort({ createdAt: -1 });
        console.log('\n--- Notification Logs ---');
        logs.forEach(log => {
            console.log(`Status: ${log.status}, RetryCount: ${log.retryCount}, MessageId: ${log.messageId}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
