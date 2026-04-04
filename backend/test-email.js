require('dotenv').config();
const { createTransporter } = require('./config/mailer');

async function testEmail() {
    const transporter = createTransporter();
    try {
        console.time('email');
        const info = await transporter.sendMail({
            from: `"Tara Fitness Centre" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Test Email',
            html: '<h1>Test</h1>'
        });
        console.timeEnd('email');
        console.log('Success:', info);
    } catch (err) {
        console.timeEnd('email');
        console.error('Error:', err);
    }
}
testEmail();
