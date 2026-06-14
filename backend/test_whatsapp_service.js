require('dotenv').config();
const mongoose = require('mongoose');
const whatsappService = require('./services/whatsappService');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // We will mock User.findOne to prevent dependency on actual DB records
        const User = require('./models/User');
        User.findOne = async () => ({
            name: 'Test User',
            email: 'ravipatil.dev@gmail.com',
            phone: '919699169574' // Put your number here
        });

        const mockUser = {
            name: 'Test User',
            phone: '919699169574'
        };

        const mockPaymentData = {
            planName: '3 Months Elite',
            amount: 4500,
            startDate: '14/06/2026',
            endDate: '14/09/2026'
        };

        const documentUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

        console.log('Testing sendPaymentPendingMessage (Cash)...');
        await whatsappService.sendPaymentPendingMessage(mockUser, mockPaymentData, documentUrl);
        
        console.log('\nTesting sendUpiPaymentPendingUser...');
        await whatsappService.sendUpiPaymentPendingUser({ userName: 'Test User', email: 'test@example.com', planName: '3 Months Elite', planPrice: 4500, transactionId: 'TXN123456789' });

        console.log('\nTesting sendPaymentConfirmedMessage (with doc)...');
        await whatsappService.sendPaymentConfirmedMessage(mockUser, mockPaymentData, documentUrl);

        console.log('\nTesting sendPaymentConfirmedMessage (without doc - fallback)...');
        await whatsappService.sendPaymentConfirmedMessage(mockUser, mockPaymentData, null);

        console.log('\nTesting sendWelcomeMessage...');
        await whatsappService.sendWelcomeMessage(mockUser);

        console.log('\nTesting sendExpiryReminder...');
        await whatsappService.sendExpiryReminder({ name: 'Test User', email: 'test@example.com', planName: '3 Months Elite', daysLeft: 3 });

        console.log('\nTesting sendOverdueReminder...');
        await whatsappService.sendOverdueReminder({ name: 'Test User', email: 'test@example.com', planName: '3 Months Elite' });

        console.log('\nTesting sendExpiredAlert...');
        await whatsappService.sendExpiredAlert({ name: 'Test User', email: 'test@example.com', planName: '3 Months Elite' });

        console.log('\nAll wrapper functions tested successfully.');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
