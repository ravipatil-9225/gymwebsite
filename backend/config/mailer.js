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
        secure: false, // TLS requires secure: false on 587, and requireTLS: true
        requireTLS: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 5000, // Important: Don't hang Vercel beyond 5 seconds!
        greetingTimeout: 5000,
        socketTimeout: 5000
    });
};

module.exports = { createTransporter };
