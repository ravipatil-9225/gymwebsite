const nodemailer = require('nodemailer');

/**
 * Singleton Nodemailer transporter for Tara Fitness.
 * Uses Gmail SMTP with App Password authentication.
 * Configured with timeouts and Port 587 to prevent Vercel Serverless hangs.
 */
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return null;
    }
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS on port 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 15000, 
        greetingTimeout: 15000,
        socketTimeout: 15000
    });
};

module.exports = { createTransporter };
