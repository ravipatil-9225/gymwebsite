const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/authMiddleware');
const verifyAdmin = require('../middleware/verifyAdmin');
const {
    selfCheckIn,
    getMyAttendance,
    getAttendanceByDate,
    adminMarkAttendance,
    adminBulkMark,
    getUserReport,
    getDailyStats,
    deleteRecord,
    getMonthlyOverview
} = require('../controllers/attendanceController');

// ── MEMBER ROUTES (user JWT) ─────────────────────────────────────────────────
router.post('/checkin',  protect, selfCheckIn);
router.get('/my',        protect, getMyAttendance);

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────
router.get('/admin',           verifyAdmin, getAttendanceByDate);
router.post('/admin/mark',     verifyAdmin, adminMarkAttendance);
router.post('/admin/bulk',     verifyAdmin, adminBulkMark);
router.get('/admin/report',    verifyAdmin, getUserReport);
router.get('/admin/stats',     verifyAdmin, getDailyStats);
router.get('/admin/monthly',   verifyAdmin, getMonthlyOverview);
router.delete('/admin/:id',    verifyAdmin, deleteRecord);

// ── MOBILE QR SCANNER ROUTES (admin scans member QR) ────────────────────────
// POST /api/attendance/check-in  — body: { userId }
router.post('/check-in', verifyAdmin, async (req, res) => {
    const Attendance = require('../models/Attendance');
    const User = require('../models/User');
    const { todayIST } = require('../controllers/attendanceController');
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'userId is required in request body' });

        const user = await User.findById(userId).select('name email phone batchTime');
        if (!user) return res.status(404).json({ message: 'Member not found. Invalid QR code.' });

        const date = todayIST();
        // Idempotent: if already checked in today, return info without error
        let record = await Attendance.findOne({ userId, date });
        if (record && record.status === 'present') {
            return res.status(200).json({
                alreadyCheckedIn: true,
                message: `${user.name} already checked in today.`,
                user: { name: user.name, email: user.email, phone: user.phone }
            });
        }

        record = await Attendance.findOneAndUpdate(
            { userId, date },
            { $set: {
                userName: user.name, userEmail: user.email,
                batchTime: user.batchTime || 'Not Assigned',
                status: 'present', markedBy: 'admin', checkInTime: new Date()
            }},
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Broadcast socket event
        try {
            const socket = require('../socket');
            socket.getIO().emit('db_changed', {});
            socket.getIO().emit('attendance_update', { date, action: 'mark', record });
        } catch (_) {}

        res.status(201).json({
            success: true,
            message: `${user.name} checked in successfully!`,
            user: { name: user.name, email: user.email, phone: user.phone }
        });
    } catch (err) {
        console.error('QR check-in error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});
// GET  /api/attendance/today     — today's check-in log for the log tab
router.get('/today', verifyAdmin, async (req, res) => {
    const { todayIST } = require('../controllers/attendanceController');
    const Attendance = require('../models/Attendance');
    const User = require('../models/User');
    try {
        const date = todayIST();
        const records = await Attendance.find({ date, status: 'present' })
            .sort({ checkInTime: -1 });
        // Populate user info
        const userIds = records.map(r => r.userId);
        const users = await User.find({ _id: { $in: userIds } }).select('name email phone');
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });
        const result = records.map(r => ({
            _id: r._id,
            createdAt: r.checkInTime,
            user: userMap[r.userId.toString()] || { name: r.userName, email: r.userEmail }
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
