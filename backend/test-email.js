/**
 * test-email.js
 * Run this to verify your SMTP settings and see a sample branded email.
 */
require('dotenv').config();
const emailService = require('./services/emailService');

const testEmail = async () => {
    console.log('🧪 Starting email diagnostic test...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Error: EMAIL_USER or EMAIL_PASS missing in .env');
        process.exit(1);
    }

    const testUser = {
        name: 'Test Administrator',
        email: process.env.OWNER_EMAIL || process.env.EMAIL_USER
    };

    console.log(`✉️  Sending test Welcome Email to: ${testUser.email}...`);

    try {
        await emailService.sendWelcomeEmail(testUser);
        console.log('✅ Success! Check your inbox (including Spam/Promotions).');
    } catch (err) {
        console.error('❌ Failed to send email.');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Error Code:', err.code);
        console.error('Full Stack:', err.stack);
        console.log('\n--- Troubleshooting ---');
        console.log('1. Ensure "2-Step Verification" is ON in your Google Account.');
        console.log('2. Ensure you are using an "App Password" (16 characters, often with spaces).');
        console.log('3. Your .env current USER:', process.env.EMAIL_USER);
    } finally {
        process.exit();
    }
};

testEmail();
