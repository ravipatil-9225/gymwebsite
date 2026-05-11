const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const socket = require('../socket');
const { compressProfileImage, uploadToCloudinary, deleteFromCloudinary } = require('../utils/imageHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'tara_fitness_secret_2024';
const OWNER = () => process.env.OWNER_EMAIL || process.env.EMAIL_USER;
const isAdminEmail = (email) => {
    if (!email) return false;
    const e = email.toLowerCase();
    const ownerObj = OWNER();
    return e === (ownerObj ? ownerObj.toLowerCase() : '') || e === 'uddhavb9561@gmail.com';
};

// @desc    Register new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, dob } = req.body;
        if (!name || !email || !password || !phone || !dob)
            return res.status(400).json({ message: 'Name, email, password, contact number, and date of birth are required.' });

        // Validate Indian mobile number format
        if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '')))
            return res.status(400).json({ message: 'Please provide a valid 10-digit Indian mobile number.' });

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists)
            return res.status(409).json({ message: 'An account with this email already exists.' });

        let role = 'user';
        if (isAdminEmail(email)) {
            role = 'admin';
        }
        const user = await User.create({ name, email, password, role, phone: phone || '', dob });
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1y' });

        emailService.sendWelcomeEmail(user).catch(console.error);
        emailService.sendAdminNewUserAlert(user).catch(console.error);
        whatsappService.sendWelcomeMessage(user).catch(console.error);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, dob: user.dob, goal: user.goal, profileImage: user.profileImage }
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

        // Auto-upgrade to admin if email matches owner
        if (isAdminEmail(email) && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }

        // Update lastLogin non-blocking (fire & forget) — don't wait for it
        User.updateOne({ _id: user._id }, { lastLogin: new Date() }).catch(() => {});

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1y' });

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || '', dob: user.dob || '', goal: user.goal || '', profileImage: user.profileImage || { url: '', public_id: '' } }
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

        // Verify with Google (5s timeout to avoid hanging)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        let response, googleUser;
        try {
            response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, { signal: controller.signal });
            googleUser = await response.json();
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok || !googleUser.email) {
            return res.status(400).json({ message: 'Invalid or expired Google token.' });
        }

        const email = googleUser.email.toLowerCase();
        let user = await User.findOne({ email });

        let role = 'user';
        if (isAdminEmail(email)) role = 'admin';

        if (!user) {
            const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            user = await User.create({ 
                name: googleUser.name, 
                email, 
                password, 
                role, 
                profileImage: { url: googleUser.picture, public_id: '' }, 
                lastLogin: new Date(), 
                phone: '0000000000' 
            });

            emailService.sendGoogleWelcomeEmail(user).catch(console.error);
            emailService.sendAdminGoogleUserAlert(user).catch(console.error);
            whatsappService.sendWelcomeMessage(user).catch(console.error);

        } else {
            if (isAdminEmail(email) && user.role !== 'admin') {
                user.role = 'admin';
                await user.save();
            }
            // Update lastLogin non-blocking — don't await it
            User.updateOne({ _id: user._id }, { lastLogin: new Date() }).catch(() => {});
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1y' });

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || '', dob: user.dob || '', goal: user.goal || '', profileImage: user.profileImage || { url: '', public_id: '' } }
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
        const { name, email, phone, dob, goal } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (phone !== undefined) user.phone = phone;
        if (dob !== undefined) user.dob = dob;
        if (goal !== undefined) user.goal = goal;

        const updated = await user.save();
        res.json({ id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, dob: updated.dob, goal: updated.goal, profileImage: updated.profileImage });
        socket.getIO().emit('db_changed');
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
};

// @desc    Upload Profile Photo
// @route   POST /api/auth/upload-photo
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Delete old image if exists
        if (user.profileImage && user.profileImage.public_id) {
            await deleteFromCloudinary(user.profileImage.public_id);
        }

        // Compress image using Sharp
        const compressedBuffer = await compressProfileImage(req.file.buffer);

        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(compressedBuffer, 'profile_photos');

        // Update user model
        user.profileImage = {
            url: uploadResult.url,
            public_id: uploadResult.public_id
        };
        user.markModified('profileImage');
        await user.save();

        res.json({ 
            message: 'Profile photo updated successfully', 
            profileImage: user.profileImage 
        });
        socket.getIO().emit('db_changed');
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ message: 'Failed to upload photo. Server error: ' + error.message, error: error.message, stack: error.stack });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' });
        }

        // Create a one-time use token 
        const secret = JWT_SECRET + user.password;
        const payload = { email: user.email, id: user._id };
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });

        // ✅ Always use the configured FRONTEND_URL — req.headers.origin is unreliable
        // in production (missing from email clients, proxies, etc.)
        let frontendURL = process.env.FRONTEND_URL || 'https://tfc365.com';
        frontendURL = frontendURL.replace(/\/+$/, ''); // Strip trailing slashes
        const link = `${frontendURL}/reset-password?id=${user._id}&token=${token}`;

        // Ensure emailService never hangs the server by enforcing a strict 5-second timeout manually
        const emailPromise = emailService.sendPasswordResetLink(user, link);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 5000));
        
        const emailSuccess = await Promise.race([emailPromise, timeoutPromise]);

        if (!emailSuccess) {
            return res.status(500).json({ 
                message: 'Failed to send password reset email. Your server might be blocking SMTP, or your credentials are out of date.' 
            });
        }

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error while sending reset link.' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { id, token, newPassword } = req.body;

        if (!id || !token || !newPassword) {
             return res.status(400).json({ message: 'Invalid request payload.' });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired reset link.' });
        }

        const secret = JWT_SECRET + user.password;
        try {
            jwt.verify(token, secret);
        } catch (err) {
            console.error('JWT Verify error during reset:', err.message);
            return res.status(400).json({ message: 'Your link has expired or is invalid.' });
        }

        // Manually hash the password to bypass any potential Mongoose validation or pre-save hook bugs
        const salt = await bcrypt.genSalt(8);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { _id: id },
            { 
                $set: { 
                    password: hashedPassword,
                    // Optionally set fallback values if missing, but updateOne skips validation anyway
                    phone: user.phone || '0000000000',
                    dob: user.dob || '1990-01-01'
                } 
            }
        );

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
    uploadProfilePhoto,
    resetPassword,
    forgotPassword
};
