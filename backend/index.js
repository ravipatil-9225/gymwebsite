require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const User = require('./models/User');
const FormSubmission = require('./models/FormSubmission');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'tara_fitness_secret_2024';

// ── EMAIL HELPER ──
const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`[EMAIL SKIPPED - no credentials] To: ${to} | Subject: ${subject}`);
        return;
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

const OWNER = () => process.env.OWNER_EMAIL || process.env.EMAIL_USER;


const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running fluently' });
});

// ── AUTH MIDDLEWARE ──
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorised, no token' });
    }
    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Token invalid or expired' });
    }
};

// ── REGISTER ──
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email, and password are required.' });

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists)
            return res.status(409).json({ message: 'An account with this email already exists.' });

        const user = await User.create({ name, email, password });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Email to owner
        sendEmail(OWNER(), `🆕 New Registration: ${name}`,
            `<h2 style="color:#E34A29">New Member Registered</h2>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>`
        ).catch(console.error);

        // Confirmation email to user
        sendEmail(email, 'Welcome to Tara Fitness! 🏋️ Account Created',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
               <h2 style="color:#E34A29">Welcome to Tara Fitness, ${name}! 💪</h2>
               <p>Your account has been successfully created. You're now part of our elite fitness community!</p>
               <p><strong>Your login email:</strong> ${email}</p>
               <br/>
               <p>Ready to start your fitness journey? Log in and explore membership plans, book sessions, and more.</p>
               <p style="margin-top:24px">Stay strong,<br/><strong>The Tara Fitness Team</strong></p>
             </div>`
        ).catch(console.error);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, dob: user.dob, goal: user.goal, photo: user.photo }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});


// ── LOGIN ──
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password are required.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(404).json({ message: 'No account found with this email. Please register first.' });

        let isMatch = false;
        try {
            isMatch = await user.matchPassword(password);
        } catch (bcryptErr) {
            console.error('Password comparison error:', bcryptErr);
            return res.status(500).json({ message: 'Password verification failed: ' + bcryptErr.message });
        }

        if (!isMatch)
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        // Notify owner of login
        sendEmail(OWNER(), `🔐 Member Login: ${user.name}`,
            `<h2 style="color:#E34A29">Member Logged In</h2>
             <p><strong>Name:</strong> ${user.name}</p>
             <p><strong>Email:</strong> ${user.email}</p>
             <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>`
        ).catch(console.error);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', dob: user.dob || '', goal: user.goal || '', photo: user.photo || '' }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// ── PLAN INTEREST (Choose Plan) ──
app.post('/api/plan-interest', async (req, res) => {
    try {
        const { name, email, planName, planPrice } = req.body;
        if (!name || !email || !planName)
            return res.status(400).json({ message: 'Name, email and plan are required.' });

        // Save as FormSubmission
        await new FormSubmission({ type: 'enquiry', name, email, message: `Interested in: ${planName} - ₹${planPrice}` }).save();

        // Email to owner
        sendEmail(OWNER(), `💳 Plan Interest: ${name} → ${planName}`,
            `<h2 style="color:#E34A29">Membership Plan Interest</h2>
             <p><strong>Member:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Plan:</strong> ${planName}</p>
             <p><strong>Price:</strong> ₹${planPrice}</p>
             <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
             <p>Please contact the member to process payment and confirm membership.</p>`
        ).catch(console.error);

        // Confirmation to user
        sendEmail(email, `✅ Tara Fitness – ${planName} Plan Request Received`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
               <h2 style="color:#E34A29">Plan Request Confirmed! 🏋️</h2>
               <p>Hi ${name},</p>
               <p>We've received your interest in the <strong>${planName}</strong> plan (₹${planPrice}).</p>
               <p>Our team will contact you shortly to confirm your membership and guide you through the payment process.</p>
               <br/>
               <p>Stay strong,<br/><strong>The Tara Fitness Team</strong></p>
             </div>`
        ).catch(console.error);

        res.json({ success: true, message: 'Plan interest recorded! We will contact you shortly.' });
    } catch (err) {
        console.error('Plan interest error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});


// ── GET PROFILE ──
app.get('/api/users/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// ── UPDATE PROFILE ──
app.put('/api/users/profile', protect, async (req, res) => {
    try {
        const { name, email, phone, dob, goal, photo } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (phone !== undefined) user.phone = phone;
        if (dob !== undefined) user.dob = dob;
        if (goal !== undefined) user.goal = goal;
        if (photo !== undefined) user.photo = photo;

        const updated = await user.save();
        res.json({ id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, dob: updated.dob, goal: updated.goal, photo: updated.photo });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
});


// Password Reset Route
app.post('/api/users/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error while resetting password' });
    }
});

// Join Us / Lead Capture Route
app.post('/api/join', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        // Save to Database
        const newSubmission = new FormSubmission({
            type: 'join',
            name,
            email,
            phone,
            message
        });
        await newSubmission.save();

        // Configure Nodemailer Transporter
        // Note: For real emails, configure EMAIL_USER and EMAIL_PASS in backend/.env
        // It's recommended to use an App Password if using Gmail.
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Standard configuration for Gmail
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;

        // 1. Email to Gym Owner
        const ownerMailOptions = {
            from: process.env.EMAIL_USER,
            to: ownerEmail,
            subject: `New Join Request: ${name}`,
            html: `
                <h2>New Membership Inquiry</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Goals/Message:</strong></p>
                <p>${message || 'No message provided'}</p>
            `,
        };

        // 2. Auto-reply Confirmation to User
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Tara Fitness - We received your request!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #E34A29;">Welcome to Tara Fitness, ${name}!</h2>
                    <p>Thank you for expressing your interest in joining our community. We have received your inquiry and are thrilled you want to take your fitness journey to the next level with us.</p>
                    <p>Our team is reviewing your details and will be in touch with you shortly to discuss membership options and get you started.</p>
                    <p>If you have any immediate questions, feel free to reply to this email.</p>
                    <br/>
                    <p>Stay strong,</p>
                    <p><strong>The Tara Fitness Team</strong></p>
                </div>
            `,
        };

        // Send emails
        // Only attempt to send if credentials exist, otherwise just log to console for dev
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(ownerMailOptions);
            await transporter.sendMail(userMailOptions);
            console.log('Join Us emails sent successfully.');
        } else {
            console.log('--- EMAIL SIMULATION (No credentials in .env) ---');
            console.log('Would send Owner Email:', ownerMailOptions.subject);
            console.log('Would send User Email:', userMailOptions.subject);
            console.log('------------------------------------------------');
        }

        res.status(200).json({ success: true, message: 'Your request has been submitted successfully. We will contact you soon!' });

    } catch (error) {
        console.error('Error processing join request:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request. Please try again later.' });
    }
});

// Generic Forms Route (Enquiry, Feedback, Classes, PT)
app.post('/api/forms', async (req, res) => {
    try {
        const { type, name, email, phone, message, date, service, rating } = req.body;

        if (!type || !name || !email) {
            return res.status(400).json({ message: 'Type, Name, and Email are required.' });
        }

        // Save to Database
        const newSubmission = new FormSubmission({
            type,
            name,
            email,
            phone,
            message,
            date,
            service,
            rating
        });
        await newSubmission.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER;

        let subjectPrefix = '';
        let htmlBody = `<h2>New ${type.replace('-', ' ').toUpperCase()} Submission</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>`;

        let userHtmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #E34A29;">Hello ${name},</h2>`;

        switch (type) {
            case 'enquiry':
                subjectPrefix = 'New Enquiry';
                htmlBody += `<p><strong>Message:</strong> ${message}</p>`;
                userHtmlBody += `<p>Thank you for reaching out to Tara Fitness. We have received your inquiry and our team will get back to you shortly.</p>`;
                break;
            case 'feedback':
                subjectPrefix = 'New Feedback Received';
                htmlBody += `<p><strong>Rating:</strong> ${rating}/5</p>
                             <p><strong>Feedback:</strong> ${message}</p>`;
                userHtmlBody += `<p>Thank you for your valuable feedback! We appreciate you taking the time to help us improve Tara Fitness.</p>`;
                break;
            case 'group-class':
                subjectPrefix = 'Group Class Booking';
                htmlBody += `<p><strong>Class:</strong> ${service}</p>
                             <p><strong>Preferred Date:</strong> ${date}</p>
                             <p><strong>Additional Notes:</strong> ${message}</p>`;
                userHtmlBody += `<p>We have received your booking request for the <strong>${service}</strong> class on <strong>${date}</strong>.</p>
                                 <p>Our team will review the schedule and confirm your spot shortly.</p>`;
                break;
            case 'pt-session':
                subjectPrefix = 'Personal Training Booking';
                htmlBody += `<p><strong>Preferred Trainer:</strong> ${service}</p>
                             <p><strong>Preferred Date:</strong> ${date}</p>
                             <p><strong>Fitness Goals:</strong> ${message}</p>`;
                userHtmlBody += `<p>We have received your Personal Training request for <strong>${service}</strong> on <strong>${date}</strong>.</p>
                                 <p>Your trainer will be in touch shortly to confirm the session and discuss your goals.</p>`;
                break;
            default:
                subjectPrefix = 'New Form Submission';
                htmlBody += `<p><strong>Message:</strong> ${message}</p>`;
                userHtmlBody += `<p>We have received your submission and will process it shortly.</p>`;
        }

        userHtmlBody += `<br/><p>Stay strong,</p><p><strong>The Tara Fitness Team</strong></p></div>`;

        const ownerMailOptions = {
            from: process.env.EMAIL_USER,
            to: ownerEmail,
            subject: `${subjectPrefix}: ${name}`,
            html: htmlBody,
        };

        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Tara Fitness - ${subjectPrefix} Confirmation`,
            html: userHtmlBody,
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(ownerMailOptions);
            await transporter.sendMail(userMailOptions);
            console.log(`Form type '${type}' emails sent successfully.`);
        } else {
            console.log(`--- EMAIL SIMULATION FOR ${type.toUpperCase()} ---`);
            console.log('Would send Owner Email:', ownerMailOptions.subject);
            console.log('Would send User Email:', userMailOptions.subject);
            console.log('------------------------------------------------');
        }

        res.status(200).json({ success: true, message: 'Form submitted successfully!' });

    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).json({ success: false, message: 'Failed to submit the form. Please try again.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
