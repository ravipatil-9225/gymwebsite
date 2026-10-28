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

// ── BIOMETRIC PUNCH ROUTE (ZKTeco K40 Pro Local Bridge Agent) ───────────────
// POST /api/attendance/biometric-punch
// Body: { deviceUserId, timestamp, secret }
//
// ✅ PLAN EXPIRY ENFORCEMENT: Every punch checks today's date against the
//    member's active Membership record. Plans can expire on ANY day of the
//    month — not just month-end — so we run this check on every single scan.
router.post('/biometric-punch', async (req, res) => {
    const Attendance = require('../models/Attendance');
    const Membership = require('../models/Membership');
    const User = require('../models/User');
    const { todayIST } = require('../controllers/attendanceController');

    try {
        const { deviceUserId, secret, timestamp } = req.body;
        const expectedSecret = process.env.BIOMETRIC_BRIDGE_SECRET || 'gym_biometric_secret_2026';

        if (secret !== expectedSecret) {
            return res.status(401).json({ message: 'Unauthorized biometric bridge request' });
        }

        if (!deviceUserId) {
            return res.status(400).json({ message: 'deviceUserId is required' });
        }

        // ── Step 1: Find the member linked to this biometric ID ──────────────
        const user = await User.findOne({ biometricCardId: String(deviceUserId).trim() })
            .select('name email phone batchTime');
        if (!user) {
            console.warn(`⛔ [BIOMETRIC] Unknown Biometric ID: ${deviceUserId} — not linked to any member.`);
            return res.status(404).json({
                success: false,
                message: `No member linked to Biometric ID ${deviceUserId}`
            });
        }

        // ── Step 2: Daily plan expiry check ──────────────────────────────────
        // Determine the actual date of the punch in IST (uses punch timestamp if available)
        const checkInTime = timestamp ? new Date(timestamp) : new Date();
        const istPunch = new Date(checkInTime.getTime() + (5.5 * 60 * 60 * 1000));
        const todayDateStr = istPunch.toISOString().slice(0, 10); // "YYYY-MM-DD"
        const todayMidnightIST = new Date(`${todayDateStr}T00:00:00+05:30`);

        const activeMembership = await Membership.findOne({
            userId: user._id,
            status: 'active',
            endDate: { $gte: todayMidnightIST }   // plan must still be valid on the punch date
        }).sort({ endDate: -1 });                  // pick the latest one if multiple

        if (!activeMembership) {
            console.warn(`⛔ [BIOMETRIC] Plan EXPIRED for ${user.name} (${user.email}) — punch rejected on ${todayDateStr}.`);
            // Emit a dedicated socket event so the admin dashboard can show a
            // real-time "Plan Expired" alert if needed in the future.
            try {
                const socket = require('../socket');
                socket.getIO().emit('biometric_denied', {
                    reason: 'plan_expired',
                    userId: user._id,
                    userName: user.name,
                    userEmail: user.email,
                    date: todayDateStr
                });
            } catch (_) {}

            return res.status(403).json({
                success: false,
                planExpired: true,
                message: `❌ Access Denied: ${user.name}'s membership plan has expired. Please renew to continue using the gym.`,
                user: { _id: user._id, name: user.name, email: user.email }
            });
        }

        // ── Step 3: Mark attendance ───────────────────────────────────────────
        let record = await Attendance.findOne({ userId: user._id, date: todayDateStr });
        let alreadyCheckedIn = false;

        if (record && record.status === 'present') {
            alreadyCheckedIn = true;
            console.log(`ℹ️  [BIOMETRIC] ${user.name} already checked in today (${todayDateStr}).`);
        } else {
            record = await Attendance.findOneAndUpdate(
                { userId: user._id, date: todayDateStr },
                {
                    $set: {
                        userName:    user.name,
                        userEmail:   user.email,
                        batchTime:   user.batchTime || 'Not Assigned',
                        status:      'present',
                        markedBy:    'biometric',
                        checkInTime
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`✅ [BIOMETRIC] Attendance marked for ${user.name} on ${todayDateStr}.`);
        }

        // ── Step 4: Broadcast real-time socket events ─────────────────────────
        // Emit BOTH events so the admin panel gets the update regardless of
        // which socket listener fires first.
        try {
            const socket = require('../socket');
            socket.getIO().emit('db_changed', { type: 'biometric_punch' });
            socket.getIO().emit('attendance_update', {
                type:             'BIOMETRIC_PUNCH',
                date:             todayDateStr,
                action:           'mark',
                alreadyCheckedIn,
                record: {
                    _id:          record._id.toString(),
                    userId:       record.userId.toString(),
                    userName:     record.userName,
                    userEmail:    record.userEmail,
                    batchTime:    record.batchTime,
                    status:       record.status,
                    markedBy:     record.markedBy,
                    checkInTime:  record.checkInTime,
                    date:         record.date
                },
                user: {
                    _id:   user._id,
                    name:  user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        } catch (err) {
            console.error('⚠️ [SOCKET ERROR] Failed to emit biometric punch update:', err.message);
        }

        return res.status(200).json({
            success: true,
            alreadyCheckedIn,
            planExpired: false,
            message: alreadyCheckedIn
                ? `${user.name} already checked in today.`
                : `✅ Biometric attendance marked for ${user.name}!`,
            membership: {
                packageName: activeMembership.packageName,
                endDate:     activeMembership.endDate
            },
            user:   { _id: user._id, name: user.name, email: user.email, phone: user.phone },
            record
        });
    } catch (err) {
        console.error('Biometric punch error:', err.message);
        return res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
