const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const emailService = require('../services/emailService');
const socket = require('../socket');

const JWT_SECRET = process.env.JWT_SECRET || 'tara_fitness_secret_2024';
const OWNER = () => process.env.OWNER_EMAIL || process.env.EMAIL_USER;

// @desc    Register new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email, and password are required.' });

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists)
            return res.status(409).json({ message: 'An account with this email already exists.' });

        let role = 'user';
        if (email.toLowerCase() === OWNER().toLowerCase()) {
            role = 'admin';
        }
        const user = await User.create({ name, email, password, role });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        emailService.sendWelcomeEmail(user).catch(console.error);
        emailService.sendAdminNewUserAlert(user).catch(console.error);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, dob: user.dob, goal: user.goal, photo: user.photo }
        });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// @desc    Authenticate user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || '', dob: user.dob || '', goal: user.goal || '', photo: user.photo || '' }
        });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Google Authentication
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
    try {
        const { token: googleToken, credential } = req.body;
        const idToken = googleToken || credential;

        if (!idToken) {
            return res.status(400).json({ message: 'No Google token or credential provided.' });
        }

        // Verify with Google
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const googleUser = await response.json();

        if (!response.ok || !googleUser.email) {
            return res.status(400).json({ message: 'Invalid or expired Google token.' });
        }

        const email = googleUser.email.toLowerCase();
        let user = await User.findOne({ email });

        let role = 'user';
        if (email === OWNER().toLowerCase()) role = 'admin';

        if (!user) {
            const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            user = await User.create({ name: googleUser.name, email, password, role, photo: googleUser.picture, lastLogin: new Date() });

            emailService.sendGoogleWelcomeEmail(user).catch(console.error);
            emailService.sendAdminGoogleUserAlert(user).catch(console.error);

        } else {
            if (email === OWNER().toLowerCase() && user.role !== 'admin') {
                user.role = 'admin';
            }
            user.lastLogin = new Date();
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || '', dob: user.dob || '', goal: user.goal || '', photo: user.photo || '' }
        });
        socket.getIO().emit('db_changed');

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Server error during Google authentication.' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
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
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' });
        }

        user.password = newPassword;
        await user.save();

        emailService.sendPasswordResetConfirmation(user).catch(console.error);

        res.status(200).json({ message: 'Password updated successfully' });
        socket.getIO().emit('db_changed');
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error while resetting password' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleAuth,
    getProfile,
    updateProfile,
    resetPassword
};
