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
        port: 465,
        secure: true, // Use SSL/TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 8000, 
        greetingTimeout: 8000,
        socketTimeout: 8000
    });
};

module.exports = { createTransporter };
