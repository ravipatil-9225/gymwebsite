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
    deleteRecord
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
router.delete('/admin/:id',    verifyAdmin, deleteRecord);

module.exports = router;
