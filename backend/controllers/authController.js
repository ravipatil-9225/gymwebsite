const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const emailService = require('../services/emailService');
const notificationEmitter = require('../events/notificationEmitter');
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
        // Route the welcome through the event pipeline (like admin-created users) so it is
        // logged in NotificationLog and retried by the sweeper if Meta hiccups. The user's
        // phone was regex-validated above, so this message is deliverable.
        notificationEmitter.emit('user_registered', { user });

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, dob: user.dob, goal: user.goal, profileImage: user.profileImage }
        });
        try { socket.getIO().emit('db_changed'); } catch (_) {}
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
            // Route through the event pipeline for logging + retry parity. Google sign-ups
            // start with a placeholder phone (0000000000), so this will be classified as a
            // permanent_failure until they add a real number — recorded rather than swallowed.
            notificationEmitter.emit('user_registered', { user });

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

        // ── Step 1: Try Resend API first (fast, bypasses SMTP blocking) ──────────
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                const fromEmail = process.env.EMAIL_FROM || 'Tara Fitness <noreply@tfc365.com>';
                const html = `
                    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:40px 20px;">
                    <table width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
                      <tr><td style="background:linear-gradient(135deg,#1a1a1a,#3a1a0e);padding:36px 40px;text-align:center;">
                        <span style="font-size:28px;font-weight:900;color:#E34A29;">TARA</span>
                        <span style="font-size:28px;font-weight:900;color:#fff;"> FITNESS</span>
                      </td></tr>
                      <tr><td style="padding:40px;">
                        <h1 style="color:#1a1a1a;">Password Reset Request</h1>
                        <p style="color:#E34A29;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Security Alert</p>
                        <p style="color:#444;line-height:1.7;">Hi <strong>${user.name || 'Member'}</strong>, we received a request to reset the password for your Tara Fitness account.</p>
                        <p style="color:#444;line-height:1.7;">Click the button below to securely set a new password. This link is valid for <strong>15 minutes</strong>.</p>
                        <div style="text-align:center;margin:28px 0;">
                          <a href="${link}" style="background:#E34A29;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">Reset Password</a>
                        </div>
                        <p style="color:#444;line-height:1.7;">If the button doesn't work, copy and paste this link:<br/><a href="${link}" style="color:#E34A29;word-break:break-all;">${link}</a></p>
                        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
                        <p style="color:#444;">If you did not request a password reset, you can safely ignore this email.</p>
                      </td></tr>
                      <tr><td style="background:#f8f8f8;padding:24px;text-align:center;border-top:2px solid #eee;">
                        <p style="color:#888;font-size:13px;">📍 Tara Fitness Centre | Your Fitness, Our Passion</p>
                      </td></tr>
                    </table>
                    </body></html>`;

                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: fromEmail,
                        to: [user.email],
                        subject: '🔒 Action Required: Reset Your Password — Tara Fitness',
                        html
                    })
                });

                const resendData = await resendResponse.json();
                if (resendResponse.ok) {
                    console.log(`✉️  Password reset email sent via Resend to ${user.email}`);
                    return res.status(200).json({ message: 'Password reset link sent to your email.' });
                }
                console.warn('[FORGOT-PWD] Resend failed:', JSON.stringify(resendData), '— falling back to SMTP');
            } catch (resendErr) {
                console.warn('[FORGOT-PWD] Resend error:', resendErr.message, '— falling back to SMTP');
            }
        }

        // ── Step 2: Fall back to Gmail SMTP (20s timeout) ─────────────────────
        const emailPromise = emailService.sendPasswordResetLink(user, link);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 20000));

        const emailSuccess = await Promise.race([emailPromise, timeoutPromise]);

        if (!emailSuccess) {
            console.error('[FORGOT-PWD] Both Resend and SMTP failed for:', user.email);
            return res.status(500).json({
                message: 'Failed to send password reset email. Please try again in a few minutes or contact support.'
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
