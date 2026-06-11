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
            phone: '919699169574'
        });

        console.log('Testing cash_payment_request_template...');
        await whatsappService.sendCashPaymentPendingUser({ userName: 'Test User', email: 'test@example.com', planName: '3 Months Elite', planPrice: 4500 });
        
        console.log('\nTesting upi_payment_pending_template...');
        await whatsappService.sendUpiPaymentPendingUser({ userName: 'Test User', email: 'test@example.com', planName: '3 Months Elite', planPrice: 4500, transactionId: 'TXN123456789' });

        console.log('\nTesting payment_receipt_template...');
        await whatsappService.sendPaymentConfirmation({ name: 'Test User', email: 'test@example.com', packageName: '3 Months Elite', amountPaid: 4500, startDate: new Date(), endDate: new Date() });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

test();
