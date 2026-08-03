const Attendance = require('../models/Attendance');
const User       = require('../models/User');
const socket     = require('../socket');

// ── HELPERS ──────────────────────────────────────────────────────────────────

/** Returns today's date string in IST as "YYYY-MM-DD" */
function todayIST() {
    const now = new Date();
    // IST = UTC + 5:30
    const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return ist.toISOString().slice(0, 10);
}

/** Emit attendance_update with full record payload for instant client-side sync */
function broadcastUpdate(payload) {
    try {
        // payload: { date, record?, action, isBulk? }
        socket.getIO().emit('attendance_update', payload);
    } catch (_) { /* socket not ready */ }
}

// ── MEMBER: SELF CHECK-IN ────────────────────────────────────────────────────
// POST /api/attendance/checkin
// Auth: user JWT (protect middleware)
const selfCheckIn = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const date   = todayIST();

        // Fetch user details
        const user = await User.findById(userId).select('name email batchTime');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Upsert — if already checked in today, return existing record
        let record = await Attendance.findOne({ userId, date });
        if (record) {
            return res.status(200).json({ alreadyCheckedIn: true, record });
        }

        record = await Attendance.create({
            userId,
            userName:  user.name,
            userEmail: user.email,
            batchTime: user.batchTime || 'Not Assigned',
            date,
            status:      'present',
            checkInTime: new Date(),
            markedBy:    'self'
        });

        broadcastUpdate({
            date,
            action: 'mark',
            record: {
                userId:      record.userId.toString(),
                userName:    record.userName,
                userEmail:   record.userEmail,
                batchTime:   record.batchTime,
                status:      record.status,
                checkInTime: record.checkInTime,
                markedBy:    record.markedBy,
                date:        record.date,
                _id:         record._id.toString()
            }
        });
        res.status(201).json({ alreadyCheckedIn: false, record });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key — race condition, treat as already checked in
            const record = await Attendance.findOne({ userId: req.user.id || req.user._id, date: todayIST() });
            return res.status(200).json({ alreadyCheckedIn: true, record });
        }
        console.error('selfCheckIn error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ── MEMBER: GET OWN ATTENDANCE ───────────────────────────────────────────────
// GET /api/attendance/my?days=30
// Auth: user JWT
const getMyAttendance = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const days   = parseInt(req.query.days) || 30;

        // Build date range (last N days in IST)
        const dates = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000) - i * 86400000);
            dates.push(ist.toISOString().slice(0, 10));
        }
        const from = dates[dates.length - 1];
        const to   = dates[0];

        const records = await Attendance.find({
            userId,
            date: { $gte: from, $lte: to }
        }).sort({ date: -1 });

        // Calculate streak
        let streak = 0;
        let checkDate = todayIST();
        const recordMap = {};
        records.forEach(r => { recordMap[r.date] = r; });

        for (let i = 0; i < 365; i++) {
            const d = new Date();
            const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000) - i * 86400000);
            const dateStr = ist.toISOString().slice(0, 10);
            if (recordMap[dateStr] && recordMap[dateStr].status === 'present') {
                streak++;
            } else {
                break;
            }
        }

        res.json({ records, streak, from, to });
    } catch (err) {
        console.error('getMyAttendance error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── ADMIN: GET ALL ATTENDANCE FOR A DATE ────────────────────────────────────
// GET /api/admin/attendance?date=2026-06-25
// Auth: admin
const getAttendanceByDate = async (req, res) => {
    try {
        const date = req.query.date || todayIST();

        // Get all non-admin users
        const users = await User.find({ role: 'user' }).select('name email batchTime');

        // Get all attendance records for that date
        const records = await Attendance.find({ date });
        const recordMap = {};
        records.forEach(r => { recordMap[r.userId.toString()] = r; });

        // Merge: for each user, attach their record or null
        const result = users.map(u => ({
            userId:    u._id,
            userName:  u.name,
            userEmail: u.email,
            batchTime: u.batchTime || 'Not Assigned',
            record:    recordMap[u._id.toString()] || null
        }));

        // Sort: checked-in first, then by name
        result.sort((a, b) => {
            if (a.record && !b.record) return -1;
            if (!a.record && b.record) return 1;
            return a.userName.localeCompare(b.userName);
        });

        res.json({ date, attendance: result });
    } catch (err) {
        console.error('getAttendanceByDate error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── ADMIN: MARK ATTENDANCE FOR ONE USER ─────────────────────────────────────
// POST /api/admin/attendance/mark
// Body: { userId, date?, status }
// Auth: admin
const adminMarkAttendance = async (req, res) => {
    try {
        const { userId, date: inputDate, status } = req.body;
        const date = inputDate || todayIST();

        if (!userId) return res.status(400).json({ message: 'userId is required' });
        if (!['present', 'absent', 'late'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findById(userId).select('name email batchTime');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const record = await Attendance.findOneAndUpdate(
            { userId, date },
            {
                $set: {
                    userName:    user.name,
                    userEmail:   user.email,
                    batchTime:   user.batchTime || 'Not Assigned',
                    status,
                    markedBy:    'admin',
                    checkInTime: (status === 'present' || status === 'late') ? new Date() : null,
                    note:        req.body.note || ''
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        broadcastUpdate({
            date,
            action: 'mark',
            record: {
                userId:      record.userId.toString(),
                userName:    record.userName,
                userEmail:   record.userEmail,
                batchTime:   record.batchTime,
                status:      record.status,
                checkInTime: record.checkInTime,
                markedBy:    record.markedBy,
                date:        record.date,
                _id:         record._id.toString()
            }
        });
        res.json({ success: true, record });
    } catch (err) {
        console.error('adminMarkAttendance error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ── ADMIN: BULK MARK ALL PRESENT ────────────────────────────────────────────
// POST /api/admin/attendance/bulk
// Body: { date?, status, userIds? }  — if userIds omitted, marks ALL users
// Auth: admin
const adminBulkMark = async (req, res) => {
    try {
        const { date: inputDate, status = 'present', userIds } = req.body;
        const date = inputDate || todayIST();

        let users;
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            users = await User.find({ _id: { $in: userIds }, role: 'user' }).select('name email batchTime');
        } else {
            users = await User.find({ role: 'user' }).select('name email batchTime');
        }

        const ops = users.map(u => ({
            updateOne: {
                filter: { userId: u._id, date },
                update: {
                    $set: {
                        userName:    u.name,
                        userEmail:   u.email,
                        batchTime:   u.batchTime || 'Not Assigned',
                        status,
                        markedBy:    'admin',
                        checkInTime: (status === 'present' || status === 'late') ? new Date() : null
                    }
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(ops);
        broadcastUpdate({ date, action: 'bulk', status, isBulk: true });
        res.json({ success: true, count: users.length, date, status });
    } catch (err) {
        console.error('adminBulkMark error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// ── ADMIN: GET ATTENDANCE REPORT FOR A USER ──────────────────────────────────
// GET /api/admin/attendance/report?userId=&from=2026-06-01&to=2026-06-30
// Auth: admin
const getUserReport = async (req, res) => {
    try {
        const { userId, from, to } = req.query;
        if (!userId) return res.status(400).json({ message: 'userId is required' });

        const query = { userId };
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = from;
            if (to)   query.date.$lte = to;
        }

        const records  = await Attendance.find(query).sort({ date: -1 });
        const present  = records.filter(r => r.status === 'present').length;
        const absent   = records.filter(r => r.status === 'absent').length;
        const late     = records.filter(r => r.status === 'late').length;

        res.json({ records, summary: { total: records.length, present, absent, late } });
    } catch (err) {
        console.error('getUserReport error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── ADMIN: DAILY STATS ───────────────────────────────────────────────────────
// GET /api/admin/attendance/stats?date=
// Auth: admin
const getDailyStats = async (req, res) => {
    try {
        const date  = req.query.date || todayIST();
        const total = await User.countDocuments({ role: 'user' });

        const agg = await Attendance.aggregate([
            { $match: { date } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const stats = { present: 0, absent: 0, late: 0, notMarked: 0 };
        agg.forEach(a => { stats[a._id] = a.count; });
        stats.notMarked = total - stats.present - stats.absent - stats.late;

        res.json({ date, total, ...stats });
    } catch (err) {
        console.error('getDailyStats error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── ADMIN: DELETE RECORD ─────────────────────────────────────────────────────
// DELETE /api/admin/attendance/:id
// Auth: admin
const deleteRecord = async (req, res) => {
    try {
        const record = await Attendance.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        broadcastUpdate({
            date:   record.date,
            action: 'delete',
            record: { userId: record.userId.toString(), date: record.date, _id: record._id.toString() }
        });
        res.json({ success: true });
    } catch (err) {
        console.error('deleteRecord error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── ADMIN: MONTHLY OVERVIEW ──────────────────────────────────────────────────
// GET /api/admin/attendance/monthly?month=2026-08
// Returns per-user monthly summary + daily breakdown for that month
const getMonthlyOverview = async (req, res) => {
    try {
        const month = req.query.month; // "YYYY-MM"
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ message: 'month query param required (YYYY-MM)' });
        }

        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        const from = `${month}-01`;
        const to   = `${month}-${String(daysInMonth).padStart(2, '0')}`;

        // Get all users
        const users = await User.find({ role: 'user' }).select('name email batchTime');

        // Get all attendance records for the month
        const records = await Attendance.find({
            date: { $gte: from, $lte: to }
        }).sort({ date: 1 });

        // Build per-user map
        const userRecordMap = {};
        records.forEach(r => {
            const uid = r.userId.toString();
            if (!userRecordMap[uid]) userRecordMap[uid] = {};
            userRecordMap[uid][r.date] = r.status;
        });

        // Build result
        const result = users.map(u => {
            const uid = u._id.toString();
            const dayMap = userRecordMap[uid] || {};
            let present = 0, absent = 0, late = 0;
            Object.values(dayMap).forEach(s => {
                if (s === 'present') present++;
                else if (s === 'absent') absent++;
                else if (s === 'late') late++;
            });
            return {
                userId: u._id,
                userName: u.name,
                userEmail: u.email,
                batchTime: u.batchTime || 'Not Assigned',
                present,
                absent,
                late,
                totalMarked: present + absent + late,
                days: dayMap // { "2026-08-01": "present", ... }
            };
        });

        // Sort by name
        result.sort((a, b) => a.userName.localeCompare(b.userName));

        res.json({ month, daysInMonth, from, to, users: result });
    } catch (err) {
        console.error('getMonthlyOverview error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    selfCheckIn,
    getMyAttendance,
    getAttendanceByDate,
    adminMarkAttendance,
    adminBulkMark,
    getUserReport,
    getDailyStats,
    deleteRecord,
    getMonthlyOverview,
    todayIST
};
