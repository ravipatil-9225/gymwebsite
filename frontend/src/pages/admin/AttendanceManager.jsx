import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays, Users, CheckCircle2, XCircle, Clock, Wifi, RefreshCw,
    ChevronLeft, ChevronRight, Download, UserCheck, UserX, AlertCircle
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

const AttendanceManager = () => {
    const token     = localStorage.getItem('adminToken');
    const [date, setDate]             = useState(todayStr());
    const [attendance, setAttendance] = useState([]);
    const [stats, setStats]           = useState({});
    const [loading, setLoading]       = useState(false);
    const [marking, setMarking]       = useState({}); // { userId: true/false }
    const [liveUpdate, setLiveUpdate] = useState(false);
    const [filter, setFilter]         = useState('all'); // all | present | absent | late | notMarked
    const [search, setSearch]         = useState('');
    const liveRef = useRef(false);

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
    useEffect(() => {
        fetchData(date);
    }, [date, fetchData]);

    // Real-time socket listener
    useEffect(() => {
        const handleUpdate = (payload) => {
            if (payload?.date === date || payload?.date === undefined) {
                setLiveUpdate(true);
                fetchData(date, true);
                setTimeout(() => setLiveUpdate(false), 2000);
            }
        };
        socket.on('attendance_update', handleUpdate);
        return () => socket.off('attendance_update', handleUpdate);
    }, [date, fetchData]);

    const markOne = async (userId, status) => {
        setMarking(m => ({ ...m, [userId]: true }));
        try {
            await fetch('/api/attendance/admin/mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId, date, status })
            });
            // Optimistic update (socket will also trigger full refresh)
            setAttendance(prev =>
                prev.map(row =>
                    row.userId === userId
                        ? { ...row, record: { ...row.record, status, markedBy: 'admin', checkInTime: new Date() } }
                        : row
                )
            );
        } catch (err) {
            console.error('Mark error:', err);
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
                row.record?.markedBy || '',
                row.record?.checkInTime ? new Date(row.record.checkInTime).toLocaleString('en-IN') : ''
            ]);
        });
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `attendance_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Apply filter + search
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

    const isToday = date === todayStr();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">Track and manage daily gym attendance for all members</p>
                </div>
                <div className="flex items-center gap-2">
                    {liveUpdate && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-medium"
                        >
                            <Wifi size={12} className="animate-pulse" />
                            Live Update
                        </motion.span>
                    )}
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
                </div>
            </div>

            {/* Date Navigator */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setDate(d => shiftDate(d, -1))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="text-center">
                        <div className="flex items-center gap-2 font-bold text-gray-900 text-lg">
                            <CalendarDays size={20} className="text-primary" />
                            {formatDate(date)}
                        </div>
                        {isToday && (
                            <span className="text-xs text-primary font-semibold tracking-wide">TODAY</span>
                        )}
                    </div>
                    <button
                        onClick={() => setDate(d => shiftDate(d, 1))}
                        disabled={date >= todayStr()}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Input for specific date */}
                <input
                    type="date"
                    max={todayStr()}
                    value={date}
                    onChange={e => e.target.value && setDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                {/* Bulk actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => bulkMark('present')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <UserCheck size={14} />
                        All Present
                    </button>
                    <button
                        onClick={() => bulkMark('absent')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                        <UserX size={14} />
                        All Absent
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: stats.total ?? '--', color: 'text-gray-900', bg: 'bg-white' },
                    { label: 'Present',        value: stats.present ?? 0, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                    { label: 'Absent',         value: stats.absent ?? 0,  color: 'text-red-600',   bg: 'bg-red-50 border-red-100' },
                    { label: 'Not Marked',     value: stats.notMarked ?? '--', color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl p-4 text-center`}>
                        <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-medium">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter + Search Bar */}
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
                                ${filter === f
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
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
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-In Time</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {displayed.map(row => {
                                        const rec    = row.record;
                                        const status = rec?.status;
                                        const isMarking = marking[row.userId.toString()];

                                        return (
                                            <motion.tr
                                                key={row.userId}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="hover:bg-gray-50 transition-colors"
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
                                                    {status ? (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
                                                            {STATUS_ICONS[status]}
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Not marked</span>
                                                    )}
                                                </td>

                                                {/* Marked By */}
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-medium ${rec?.markedBy === 'self' ? 'text-blue-500' : rec?.markedBy === 'admin' ? 'text-purple-500' : 'text-gray-400'}`}>
                                                        {rec?.markedBy ? (rec.markedBy === 'self' ? 'Self Check-in' : 'Admin') : '—'}
                                                    </span>
                                                </td>

                                                {/* Check-In Time */}
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {rec?.checkInTime
                                                        ? new Date(rec.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                                                        : '—'}
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
                                                                {isMarking ? (
                                                                    <RefreshCw size={12} className="animate-spin" />
                                                                ) : (
                                                                    STATUS_ICONS[s]
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>

                        {/* Table Footer */}
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                            <span>Showing {displayed.length} of {attendance.length} members</span>
                            <span className="flex items-center gap-1.5 text-green-600">
                                <Wifi size={11} />
                                Real-time sync active
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManager;
