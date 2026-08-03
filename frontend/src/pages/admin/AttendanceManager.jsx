import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, CheckCircle2, XCircle, Clock, Wifi, RefreshCw,
    ChevronLeft, ChevronRight, Download, UserCheck, UserX, AlertCircle,
    Calendar, FileText, Search
} from 'lucide-react';
import socket from '../../utils/socket';

const STATUS_COLORS = {
    present: 'bg-green-500/10 text-green-400 border-green-500/30',
    absent:  'bg-red-500/10 text-red-400 border-red-500/30',
    late:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
};

const STATUS_ICONS = {
    present: <CheckCircle2 size={14} />,
    absent:  <XCircle size={14} />,
    late:    <Clock size={14} />,
};

function todayStr() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
}

function shiftDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function getCurrentMonthStr() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 7); // "YYYY-MM"
}

function getMonthLabel(monthStr) {
    const [year, mon] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(mon) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function shiftMonth(monthStr, delta) {
    const [year, mon] = monthStr.split('-').map(Number);
    const d = new Date(year, mon - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Recompute stats from the attendance array (no API needed for single-mark updates)
function recomputeStats(attendanceArr, total) {
    let present = 0, absent = 0, late = 0;
    attendanceArr.forEach(r => {
        if (r.record?.status === 'present') present++;
        else if (r.record?.status === 'absent') absent++;
        else if (r.record?.status === 'late') late++;
    });
    const notMarked = (total || attendanceArr.length) - present - absent - late;
    return { present, absent, late, notMarked, total: total || attendanceArr.length };
}

const AttendanceManager = () => {
    const token = localStorage.getItem('adminToken');
    const [date, setDate]             = useState(todayStr());
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats]           = useState({});
    const [loading, setLoading]       = useState(false);
    const [marking, setMarking]       = useState({});
    const [flashedRows, setFlashedRows] = useState({}); // { userId: 'green'|'red'|'yellow' }
    const [liveUpdate, setLiveUpdate] = useState(null); // { name, status, markedBy, time }
    const [filter, setFilter]         = useState('all');
    const [search, setSearch]         = useState('');
    
    // History Tab States
    const [activeTab, setActiveTab] = useState('daily');
    const [historyUser, setHistoryUser] = useState('');
    const [historyFrom, setHistoryFrom] = useState(() => shiftDate(todayStr(), -30));
    const [historyTo, setHistoryTo] = useState(todayStr());
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Monthly Tab States
    const [monthlyMonth, setMonthlyMonth] = useState(getCurrentMonthStr());
    const [monthlyData, setMonthlyData] = useState(null);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [monthlySearch, setMonthlySearch] = useState('');
    const [monthlyExpandedUser, setMonthlyExpandedUser] = useState(null);

    // ── Full fetch (used on initial load, date change, bulk ops) ──────────────
    const fetchData = useCallback(async (d, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [attRes, statsRes] = await Promise.all([
                fetch(`/api/attendance/admin?date=${d}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/attendance/admin/stats?date=${d}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const attData   = await attRes.json();
            const statsData = await statsRes.json();
            setAttendance(attData.attendance || []);
            setStats(statsData || {});
        } catch (err) {
            console.error('Attendance fetch error:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [token]);

    // Initial load + date change
    useEffect(() => { fetchData(date); }, [date, fetchData]);

    // ── Real-time socket: instant row patch (no API call for single marks) ────
    useEffect(() => {
        const handleUpdate = (payload) => {
            if (!payload || payload.date !== date) return;

            if (payload.isBulk) {
                // Bulk: full refetch needed
                fetchData(date, true);
                setLiveUpdate({ name: 'All members', status: payload.status, markedBy: 'admin', time: new Date() });
                setTimeout(() => setLiveUpdate(null), 3500);
                return;
            }

            if (payload.action === 'delete') {
                // Remove the record for that user
                setAttendance(prev => {
                    const next = prev.map(row =>
                        row.userId.toString() === payload.record?.userId
                            ? { ...row, record: null }
                            : row
                    );
                    setStats(recomputeStats(next, stats.total));
                    return next;
                });
                return;
            }

            if (payload.action === 'mark' && payload.record) {
                const rec = payload.record;
                setAttendance(prev => {
                    const next = prev.map(row => {
                        if (row.userId.toString() !== rec.userId) return row;
                        return {
                            ...row,
                            record: {
                                ...row.record,
                                status:      rec.status,
                                checkInTime: rec.checkInTime,
                                markedBy:    rec.markedBy,
                                _id:         rec._id
                            }
                        };
                    });
                    setStats(recomputeStats(next, stats.total));
                    return next;
                });

                // Flash the row green/yellow/red for 2s
                const flashColor = rec.status === 'present' ? 'present' : rec.status === 'late' ? 'late' : 'absent';
                setFlashedRows(f => ({ ...f, [rec.userId]: flashColor }));
                setTimeout(() => setFlashedRows(f => { const n = { ...f }; delete n[rec.userId]; return n; }), 2000);

                // Show live badge in header
                setLiveUpdate({
                    name:     rec.userName,
                    status:   rec.status,
                    markedBy: rec.markedBy,
                    time:     rec.checkInTime ? new Date(rec.checkInTime) : new Date()
                });
                setTimeout(() => setLiveUpdate(null), 3500);
            }
        };

        socket.on('attendance_update', handleUpdate);
        return () => socket.off('attendance_update', handleUpdate);
    }, [date, fetchData, stats.total]);

    // ── Admin mark one user (optimistic + server confirm via socket) ──────────
    const markOne = async (userId, status) => {
        setMarking(m => ({ ...m, [userId]: true }));
        // Optimistic instant update
        const now = new Date();
        setAttendance(prev => {
            const next = prev.map(row =>
                row.userId.toString() === userId
                    ? { ...row, record: { ...(row.record || {}), status, markedBy: 'admin', checkInTime: status === 'present' || status === 'late' ? now : null } }
                    : row
            );
            setStats(recomputeStats(next, stats.total));
            return next;
        });
        try {
            await fetch('/api/attendance/admin/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId, date, status })
            });
        } catch (err) {
            console.error('Mark error:', err);
            // On error, revert by re-fetching
            fetchData(date, true);
        } finally {
            setMarking(m => ({ ...m, [userId]: false }));
        }
    };

    const bulkMark = async (status) => {
        if (!window.confirm(`Mark ALL members as "${status}" for ${formatDate(date)}?`)) return;
        setLoading(true);
        try {
            await fetch('/api/attendance/admin/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ date, status })
            });
            await fetchData(date);
        } catch (err) {
            console.error('Bulk mark error:', err);
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const rows = [['Name', 'Email', 'Batch', 'Status', 'Marked By', 'Check-In Time']];
        attendance.forEach(row => {
            rows.push([
                row.userName,
                row.userEmail,
                row.batchTime,
                row.record?.status || 'Not Marked',
                row.record?.markedBy === 'self' ? 'Self Check-in' : row.record?.markedBy === 'admin' ? 'Admin' : '',
                row.record?.checkInTime ? formatTime(row.record.checkInTime) : ''
            ]);
        });
        const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `attendance_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const fetchHistory = async () => {
        if (!historyUser) return;
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/attendance/admin/report?userId=${historyUser}&from=${historyFrom}&to=${historyTo}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setHistoryData(data);
        } catch (err) {
            console.error('Fetch history error:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ── Download client history as CSV ────────────────────────────────────────
    const downloadClientHistoryCSV = () => {
        if (!historyData || !historyData.records?.length) return;
        const selectedUser = attendance.find(r => r.userId.toString() === historyUser);
        const userName = selectedUser?.userName || 'client';
        const rows = [['Date', 'Status', 'Marked By', 'Check-In Time']];
        historyData.records.forEach(rec => {
            rows.push([
                formatDate(rec.date),
                rec.status ? rec.status.charAt(0).toUpperCase() + rec.status.slice(1) : 'Unknown',
                rec.markedBy === 'self' ? 'Self Check-in' : rec.markedBy === 'admin' ? 'Admin' : '—',
                rec.checkInTime ? formatTime(rec.checkInTime) : '—'
            ]);
        });
        // Add summary row
        rows.push([]);
        rows.push(['Summary']);
        rows.push(['Total Days', historyData.summary?.total || 0]);
        rows.push(['Present', historyData.summary?.present || 0]);
        rows.push(['Absent', historyData.summary?.absent || 0]);
        rows.push(['Late', historyData.summary?.late || 0]);
        if (historyData.summary?.total > 0) {
            const pct = ((historyData.summary.present + historyData.summary.late) / historyData.summary.total * 100).toFixed(1);
            rows.push(['Attendance %', `${pct}%`]);
        }

        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${userName.replace(/\s+/g, '_')}_${historyFrom}_to_${historyTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Fetch monthly data ────────────────────────────────────────────────────
    const fetchMonthly = useCallback(async (month) => {
        setMonthlyLoading(true);
        try {
            const res = await fetch(`/api/attendance/admin/monthly?month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setMonthlyData(data);
        } catch (err) {
            console.error('Fetch monthly error:', err);
        } finally {
            setMonthlyLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (activeTab === 'monthly') {
            fetchMonthly(monthlyMonth);
        }
    }, [activeTab, monthlyMonth, fetchMonthly]);

    // ── Download monthly CSV ──────────────────────────────────────────────────
    const downloadMonthlyCSV = () => {
        if (!monthlyData?.users?.length) return;
        const daysInMonth = monthlyData.daysInMonth;
        const header = ['Name', 'Email', 'Batch'];
        for (let d = 1; d <= daysInMonth; d++) {
            header.push(String(d));
        }
        header.push('Present', 'Absent', 'Late', 'Total Marked', 'Attendance %');

        const rows = [header];
        monthlyData.users.forEach(u => {
            const row = [u.userName, u.userEmail, u.batchTime];
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${monthlyMonth}-${String(d).padStart(2, '0')}`;
                const status = u.days[dateStr];
                row.push(status ? status.charAt(0).toUpperCase() : '—');
            }
            const pct = u.totalMarked > 0 ? ((u.present + u.late) / u.totalMarked * 100).toFixed(1) + '%' : '—';
            row.push(u.present, u.absent, u.late, u.totalMarked, pct);
            rows.push(row);
        });

        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly_attendance_${monthlyMonth}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter + search
    const displayed = attendance.filter(row => {
        const matchSearch = search === '' ||
            row.userName.toLowerCase().includes(search.toLowerCase()) ||
            row.userEmail.toLowerCase().includes(search.toLowerCase()) ||
            (row.batchTime || '').toLowerCase().includes(search.toLowerCase());
        const status = row.record?.status;
        const matchFilter =
            filter === 'all'       ? true :
            filter === 'notMarked' ? !status :
            status === filter;
        return matchSearch && matchFilter;
    });

    // Monthly filtered users
    const monthlyDisplayed = (monthlyData?.users || []).filter(u => {
        if (!monthlySearch) return true;
        const q = monthlySearch.toLowerCase();
        return u.userName.toLowerCase().includes(q) ||
               u.userEmail.toLowerCase().includes(q) ||
               (u.batchTime || '').toLowerCase().includes(q);
    });

    const isToday = date === todayStr();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">Track and manage daily gym attendance for all members</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Live update toast */}
                    <AnimatePresence>
                        {liveUpdate && activeTab === 'daily' && (
                            <motion.div
                                key="live-toast"
                                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 30, scale: 0.9 }}
                                className="flex items-center gap-2 bg-white border border-green-200 shadow-lg rounded-xl px-3 py-2"
                            >
                                <Wifi size={13} className="text-green-500 animate-pulse flex-shrink-0" />
                                <div className="text-xs leading-tight">
                                    <span className="font-bold text-gray-900">{liveUpdate.name}</span>
                                    <span className="text-gray-500"> marked </span>
                                    <span className={`font-bold capitalize ${liveUpdate.status === 'present' ? 'text-green-600' : liveUpdate.status === 'late' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {liveUpdate.status}
                                    </span>
                                    <span className="text-gray-400 ml-1">
                                        by {liveUpdate.markedBy === 'self' ? 'Self' : 'Admin'} · {formatTime(liveUpdate.time)}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {activeTab === 'daily' && (
                        <>
                            <button
                                onClick={() => fetchData(date)}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            <button
                                onClick={exportCSV}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Download size={14} />
                                CSV
                            </button>
                        </>
                    )}
                    {activeTab === 'monthly' && (
                        <button
                            onClick={downloadMonthlyCSV}
                            disabled={!monthlyData?.users?.length}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                        >
                            <Download size={14} />
                            Download CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'daily' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Daily Attendance
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'monthly' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Monthly Attendance
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Client History
                </button>
            </div>

            {/* ══════════════════════════ DAILY TAB ══════════════════════════ */}
            {activeTab === 'daily' && (
                <>

            {/* Date Navigator */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setDate(d => shiftDate(d, -1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="text-center">
                        <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
                            <CalendarDays size={20} className="text-primary" />
                            {formatDate(date)}
                        </div>
                        {isToday && <span className="text-xs text-primary font-semibold tracking-wide">TODAY</span>}
                    </div>
                    <button
                        onClick={() => setDate(d => shiftDate(d, 1))}
                        disabled={date >= todayStr()}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <input
                    type="date"
                    max={todayStr()}
                    value={date}
                    onChange={e => e.target.value && setDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <div className="flex gap-2">
                    <button onClick={() => bulkMark('present')} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors">
                        <UserCheck size={14} /> All Present
                    </button>
                    <button onClick={() => bulkMark('absent')} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors">
                        <UserX size={14} /> All Absent
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: stats.total ?? '--', color: 'text-gray-900',  bg: 'bg-white' },
                    { label: 'Present',        value: stats.present ?? 0,  color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                    { label: 'Absent',         value: stats.absent ?? 0,   color: 'text-red-600',   bg: 'bg-red-50 border-red-100' },
                    { label: 'Not Marked',     value: stats.notMarked ?? '--', color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(s => (
                    <motion.div
                        key={s.label}
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 0.3 }}
                        className={`${s.bg} border border-gray-200 rounded-xl p-4 text-center`}
                    >
                        <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Filter + Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Search by name, email, or batch..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2 flex-wrap">
                    {['all', 'present', 'absent', 'late', 'notMarked'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize
                                ${filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {f === 'notMarked' ? 'Not Marked' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <RefreshCw size={28} className="animate-spin text-primary" />
                        <p className="text-sm text-gray-500">Loading attendance...</p>
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                        <AlertCircle size={32} />
                        <p className="text-sm">No members found for this filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marked By</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayed.map(row => {
                                    const rec       = row.record;
                                    const status    = rec?.status;
                                    const isMarking = marking[row.userId.toString()];
                                    const flash     = flashedRows[row.userId.toString()];

                                    const flashBg =
                                        flash === 'present' ? 'bg-green-50' :
                                        flash === 'absent'  ? 'bg-red-50' :
                                        flash === 'late'    ? 'bg-yellow-50' : '';

                                    return (
                                        <motion.tr
                                            key={row.userId}
                                            layout
                                            className={`transition-colors duration-500 ${flash ? flashBg : 'hover:bg-gray-50'}`}
                                        >
                                            {/* Member */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                                        {row.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{row.userName}</p>
                                                        <p className="text-xs text-gray-400">{row.userEmail}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Batch */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {row.batchTime || 'Not Assigned'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <AnimatePresence mode="wait">
                                                    {status ? (
                                                        <motion.span
                                                            key={status}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}
                                                        >
                                                            {STATUS_ICONS[status]}
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </motion.span>
                                                    ) : (
                                                        <motion.span
                                                            key="none"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-xs text-gray-400 italic"
                                                        >
                                                            Not marked
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </td>

                                            {/* Marked By */}
                                            <td className="px-4 py-3">
                                                <AnimatePresence mode="wait">
                                                    <motion.span
                                                        key={rec?.markedBy || 'none'}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className={`text-xs font-medium ${
                                                            rec?.markedBy === 'self'  ? 'text-blue-500' :
                                                            rec?.markedBy === 'admin' ? 'text-purple-500' :
                                                            'text-gray-400'
                                                        }`}
                                                    >
                                                        {rec?.markedBy === 'self' ? 'Self Check-in' : rec?.markedBy === 'admin' ? 'Admin' : '—'}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </td>

                                            {/* Time */}
                                            <td className="px-4 py-3">
                                                <AnimatePresence mode="wait">
                                                    <motion.span
                                                        key={rec?.checkInTime || 'none'}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-xs text-gray-600 font-mono tabular-nums"
                                                    >
                                                        {rec?.checkInTime ? formatTime(rec.checkInTime) : '—'}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {['present', 'late', 'absent'].map(s => (
                                                        <button
                                                            key={s}
                                                            disabled={isMarking || status === s}
                                                            onClick={() => markOne(row.userId.toString(), s)}
                                                            title={s.charAt(0).toUpperCase() + s.slice(1)}
                                                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed
                                                                ${status === s
                                                                    ? s === 'present' ? 'bg-green-100 border-green-300 text-green-700'
                                                                    : s === 'absent'  ? 'bg-red-100 border-red-300 text-red-700'
                                                                    : 'bg-yellow-100 border-yellow-300 text-yellow-700'
                                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {isMarking ? <RefreshCw size={12} className="animate-spin" /> : STATUS_ICONS[s]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Footer */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                            <span>Showing {displayed.length} of {attendance.length} members</span>
                            <span className="flex items-center gap-1.5 text-green-600 font-medium">
                                <Wifi size={11} className="animate-pulse" />
                                Real-time sync active
                            </span>
                        </div>
                    </div>
                )}
            </div>
            </>
            )}

            {/* ══════════════════════════ MONTHLY TAB ══════════════════════════ */}
            {activeTab === 'monthly' && (
                <div className="space-y-5">
                    {/* Month Navigator */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMonthlyMonth(m => shiftMonth(m, -1))}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="text-center">
                                <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
                                    <Calendar size={20} className="text-primary" />
                                    {getMonthLabel(monthlyMonth)}
                                </div>
                                {monthlyMonth === getCurrentMonthStr() && (
                                    <span className="text-xs text-primary font-semibold tracking-wide">CURRENT MONTH</span>
                                )}
                            </div>
                            <button
                                onClick={() => setMonthlyMonth(m => shiftMonth(m, 1))}
                                disabled={monthlyMonth >= getCurrentMonthStr()}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <input
                            type="month"
                            value={monthlyMonth}
                            max={getCurrentMonthStr()}
                            onChange={e => e.target.value && setMonthlyMonth(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    {/* Monthly Stats Summary */}
                    {monthlyData && !monthlyLoading && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {(() => {
                                let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalMarked = 0;
                                monthlyData.users.forEach(u => {
                                    totalPresent += u.present;
                                    totalAbsent += u.absent;
                                    totalLate += u.late;
                                    totalMarked += u.totalMarked;
                                });
                                return [
                                    { label: 'Total Members', value: monthlyData.users.length, color: 'text-gray-900', bg: 'bg-white' },
                                    { label: 'Total Present', value: totalPresent, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                                    { label: 'Total Absent', value: totalAbsent, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                                    { label: 'Total Late', value: totalLate, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl p-4 text-center`}>
                                        <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">{s.label}</div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {/* Search bar */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or batch..."
                                value={monthlySearch}
                                onChange={e => setMonthlySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    {/* Monthly Grid/Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {monthlyLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <RefreshCw size={28} className="animate-spin text-primary" />
                                <p className="text-sm text-gray-500">Loading monthly attendance...</p>
                            </div>
                        ) : !monthlyData ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                                <Calendar size={32} />
                                <p className="text-sm">Select a month to view attendance.</p>
                            </div>
                        ) : monthlyDisplayed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                                <AlertCircle size={32} />
                                <p className="text-sm">No members found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[180px]">Member</th>
                                            <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                                            {/* Day columns */}
                                            {Array.from({ length: monthlyData.daysInMonth }, (_, i) => (
                                                <th key={i + 1} className="text-center px-1 py-3 text-xs font-semibold text-gray-400 min-w-[28px]">
                                                    {i + 1}
                                                </th>
                                            ))}
                                            <th className="text-center px-3 py-3 text-xs font-semibold text-green-600 uppercase tracking-wider bg-green-50/50">P</th>
                                            <th className="text-center px-3 py-3 text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50/50">A</th>
                                            <th className="text-center px-3 py-3 text-xs font-semibold text-yellow-600 uppercase tracking-wider bg-yellow-50/50">L</th>
                                            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {monthlyDisplayed.map(u => {
                                            const pct = u.totalMarked > 0 ? Math.round((u.present + u.late) / u.totalMarked * 100) : 0;
                                            const isExpanded = monthlyExpandedUser === u.userId.toString();
                                            return (
                                                <React.Fragment key={u.userId}>
                                                    <tr
                                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => setMonthlyExpandedUser(isExpanded ? null : u.userId.toString())}
                                                    >
                                                        <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
                                                                    {u.userName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-xs leading-tight">{u.userName}</p>
                                                                    <p className="text-[10px] text-gray-400">{u.userEmail}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center px-2 py-2.5">
                                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                                {u.batchTime}
                                                            </span>
                                                        </td>
                                                        {/* Day cells */}
                                                        {Array.from({ length: monthlyData.daysInMonth }, (_, i) => {
                                                            const dayStr = `${monthlyMonth}-${String(i + 1).padStart(2, '0')}`;
                                                            const status = u.days[dayStr];
                                                            const isFuture = dayStr > todayStr();
                                                            return (
                                                                <td key={i + 1} className="text-center px-0.5 py-2.5">
                                                                    {isFuture ? (
                                                                        <span className="text-[10px] text-gray-200">·</span>
                                                                    ) : status === 'present' ? (
                                                                        <span className="inline-block w-5 h-5 rounded-md bg-green-100 text-green-600 text-[10px] font-bold leading-5">P</span>
                                                                    ) : status === 'absent' ? (
                                                                        <span className="inline-block w-5 h-5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold leading-5">A</span>
                                                                    ) : status === 'late' ? (
                                                                        <span className="inline-block w-5 h-5 rounded-md bg-yellow-100 text-yellow-600 text-[10px] font-bold leading-5">L</span>
                                                                    ) : (
                                                                        <span className="inline-block w-5 h-5 rounded-md bg-gray-50 text-gray-300 text-[10px] leading-5">—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="text-center px-3 py-2.5 bg-green-50/30 font-bold text-green-700 text-xs">{u.present}</td>
                                                        <td className="text-center px-3 py-2.5 bg-red-50/30 font-bold text-red-700 text-xs">{u.absent}</td>
                                                        <td className="text-center px-3 py-2.5 bg-yellow-50/30 font-bold text-yellow-700 text-xs">{u.late}</td>
                                                        <td className="text-center px-3 py-2.5">
                                                            <span className={`text-xs font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                {u.totalMarked > 0 ? `${pct}%` : '—'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {/* Expanded detail row */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={monthlyData.daysInMonth + 6} className="px-4 py-3 bg-gray-50/60">
                                                                <div className="flex flex-wrap gap-3 text-xs">
                                                                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                                        <span className="text-gray-500">Total Marked: </span>
                                                                        <span className="font-bold text-gray-900">{u.totalMarked} / {monthlyData.daysInMonth} days</span>
                                                                    </div>
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                                                        <span className="text-gray-500">Present: </span>
                                                                        <span className="font-bold text-green-700">{u.present}</span>
                                                                    </div>
                                                                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                                        <span className="text-gray-500">Absent: </span>
                                                                        <span className="font-bold text-red-700">{u.absent}</span>
                                                                    </div>
                                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                                                        <span className="text-gray-500">Late: </span>
                                                                        <span className="font-bold text-yellow-700">{u.late}</span>
                                                                    </div>
                                                                    <div className={`border rounded-lg px-3 py-2 ${pct >= 80 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                                                                        <span className="text-gray-500">Attendance: </span>
                                                                        <span className={`font-bold ${pct >= 80 ? 'text-green-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>{u.totalMarked > 0 ? `${pct}%` : '—'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Footer */}
                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                                    <span>Showing {monthlyDisplayed.length} of {monthlyData.users.length} members</span>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300"></span> Present</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300"></span> Absent</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span> Late</span>
                                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-50 border border-gray-200"></span> Not Marked</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════ CLIENT HISTORY TAB ══════════════════════════ */}
            {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Client</label>
                        <select
                            value={historyUser}
                            onChange={e => setHistoryUser(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">-- Select a Client --</option>
                            {attendance.map(row => (
                                <option key={row.userId} value={row.userId}>{row.userName} ({row.userEmail})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                        <input
                            type="date"
                            value={historyFrom}
                            onChange={e => setHistoryFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">To Date</label>
                        <input
                            type="date"
                            value={historyTo}
                            onChange={e => setHistoryTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={fetchHistory}
                            disabled={!historyUser || historyLoading}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {historyLoading ? <RefreshCw size={16} className="animate-spin" /> : <Clock size={16} />}
                            Get History
                        </button>
                    </div>
                </div>

                {historyData && (
                    <div className="space-y-4">
                        {/* Summary Cards + Download Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 flex-1">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-gray-900">{historyData.summary?.total || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">Total Days</div>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-green-600">{historyData.summary?.present || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">Present</div>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-red-600">{historyData.summary?.absent || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">Absent</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-black text-yellow-600">{historyData.summary?.late || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">Late</div>
                                </div>
                                <div className={`border rounded-xl p-4 text-center ${
                                    historyData.summary?.total > 0
                                        ? ((historyData.summary.present + historyData.summary.late) / historyData.summary.total * 100) >= 80
                                            ? 'bg-green-50 border-green-100'
                                            : ((historyData.summary.present + historyData.summary.late) / historyData.summary.total * 100) >= 50
                                                ? 'bg-yellow-50 border-yellow-100'
                                                : 'bg-red-50 border-red-100'
                                        : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className={`text-2xl font-black ${
                                        historyData.summary?.total > 0
                                            ? ((historyData.summary.present + historyData.summary.late) / historyData.summary.total * 100) >= 80
                                                ? 'text-green-600'
                                                : ((historyData.summary.present + historyData.summary.late) / historyData.summary.total * 100) >= 50
                                                    ? 'text-yellow-600'
                                                    : 'text-red-600'
                                            : 'text-gray-400'
                                    }`}>
                                        {historyData.summary?.total > 0
                                            ? `${Math.round((historyData.summary.present + historyData.summary.late) / historyData.summary.total * 100)}%`
                                            : '—'}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">Attendance</div>
                                </div>
                            </div>
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={downloadClientHistoryCSV}
                                disabled={!historyData.records?.length}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <FileText size={16} />
                                Download Attendance Report
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marked By</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {historyData.records?.length > 0 ? historyData.records.map(rec => (
                                            <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{formatDate(rec.date)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[rec.status] || 'bg-gray-100 text-gray-500'}`}>
                                                        {STATUS_ICONS[rec.status]}
                                                        {rec.status ? rec.status.charAt(0).toUpperCase() + rec.status.slice(1) : 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{rec.markedBy === 'self' ? 'Self Check-in' : rec.markedBy === 'admin' ? 'Admin' : '—'}</td>
                                                <td className="px-4 py-3 text-gray-500 font-mono">{rec.checkInTime ? formatTime(rec.checkInTime) : '—'}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No attendance records found for this period.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default AttendanceManager;
