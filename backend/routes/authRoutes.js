const express = require('express');
const { 
    registerUser, 
    loginUser, 
    googleAuth, 
    getProfile, 
    updateProfile, 
    uploadProfilePhoto,
    resetPassword,
    forgotPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');
const User = require('../models/User');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/upload-photo', protect, upload.single('photo'), uploadProfilePhoto);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ── Push token registration (mobile app) ──────────────────────────────────────
router.post('/push-token', protect, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'Token required' });
        await User.findByIdAndUpdate(req.user.id, { expoPushToken: token });
        res.json({ success: true });
    } catch (err) {
        console.error('Push token save error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

