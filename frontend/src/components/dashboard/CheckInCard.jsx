import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Flame, CalendarDays, Loader2, Wifi } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import socket from '../../utils/socket';

function todayStr() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
}

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STATUS_META = {
    present: { icon: <CheckCircle2 className="w-7 h-7 text-green-400" />,  ring: 'bg-green-500/10 border-green-500/30', label: "You're Checked In!", color: 'text-green-400' },
    absent:  { icon: <XCircle className="w-7 h-7 text-red-400" />,         ring: 'bg-red-500/10 border-red-500/30',   label: 'Marked Absent',       color: 'text-red-400'   },
    late:    { icon: <Clock className="w-7 h-7 text-yellow-400" />,         ring: 'bg-yellow-500/10 border-yellow-500/30', label: 'Marked Late',    color: 'text-yellow-400' },
};

const CheckInCard = () => {
    const { token, user } = useContext(AuthContext);
    const currentUserId   = user?._id || user?.id;

    const [todayRecord, setTodayRecord] = useState(null); // full record object or null
    const [streak, setStreak]           = useState(0);
    const [history, setHistory]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [checking, setChecking]       = useState(false);
    const [error, setError]             = useState('');
    const [liveTag, setLiveTag]         = useState(null); // { status, time, markedBy }

    // ── Fetch own attendance history + streak ─────────────────────────────────
    const fetchStatus = useCallback(async (silent = false) => {
        if (!token) return;
        if (!silent) setLoading(true);
        try {
            const res = await axios.get('/api/attendance/my?days=30', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { records, streak: s } = res.data;
            setStreak(s || 0);
            setHistory(records || []);
            const today = todayStr();
            const rec   = (records || []).find(r => r.date === today);
            setTodayRecord(rec || null);
        } catch (err) {
            console.error('CheckInCard fetch error:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    // ── Real-time: instant state patch if this user's record changed ──────────
    useEffect(() => {
        const handler = (payload) => {
            if (!payload || !payload.record) {
                // Bulk update or delete — do a full re-fetch
                fetchStatus(true);
                return;
            }

            const rec = payload.record;
            const recUserIdStr = rec.userId?.toString() || String(rec.userId || '');
            // Only react if this record belongs to the current user
            if (recUserIdStr !== currentUserId?.toString()) return;

            if (payload.action === 'delete') {
                setTodayRecord(null);
                // Update history
                setHistory(prev => prev.filter(r => r.date !== rec.date));
                return;
            }

            if (payload.action === 'mark') {
                const updated = {
                    userId:      rec.userId,
                    userName:    rec.userName,
                    date:        rec.date,
                    status:      rec.status,
                    checkInTime: rec.checkInTime,
                    markedBy:    rec.markedBy,
                    _id:         rec._id
                };

                // Update todayRecord instantly (if event is for today)
                if (rec.date === todayStr()) {
                    setTodayRecord(updated);

                    // Recompute streak locally
                    if (rec.status === 'present') {
                        setStreak(s => s === 0 ? 1 : s); // conservative — re-fetch will fix
                    }
                }

                // Patch history array
                setHistory(prev => {
                    const exists = prev.find(r => r.date === rec.date);
                    if (exists) return prev.map(r => r.date === rec.date ? { ...r, ...updated } : r);
                    return [updated, ...prev].sort((a, b) => b.date.localeCompare(a.date));
                });

                // Show live tag for 3s
                setLiveTag({ status: rec.status, time: rec.checkInTime, markedBy: rec.markedBy });
                setTimeout(() => setLiveTag(null), 3500);
            }
        };

        socket.on('attendance_update', handler);
        return () => socket.off('attendance_update', handler);
    }, [currentUserId, fetchStatus]);

    // ── Member self check-in ──────────────────────────────────────────────────
    const handleCheckIn = async () => {
        if (todayRecord || checking) return;
        setChecking(true);
        setError('');
        try {
            const res = await axios.post('/api/attendance/checkin', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { record } = res.data;
            setTodayRecord(record);
            setStreak(s => s + 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    // ── Build 14-day calendar ─────────────────────────────────────────────────
    const calDays = Array.from({ length: 14 }, (_, i) => {
        const d   = new Date();
        const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000 - (13 - i) * 86400000);
        const dateStr    = ist.toISOString().slice(0, 10);
        const rec        = history.find(r => r.date === dateStr);
        const isToday    = dateStr === todayStr();
        const dayOfWeek  = ist.getUTCDay();
        return { dateStr, rec, isToday, dayOfWeek };
    });

    if (loading) {
        return (
            <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center justify-center h-44">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    const meta      = todayRecord ? STATUS_META[todayRecord.status] : null;
    const hasStatus = !!todayRecord;

    return (
        <div className={`glass-card p-6 rounded-2xl border transition-all duration-500 ${liveTag ? 'border-primary/40 shadow-[0_0_20px_rgba(227,74,41,0.12)]' : 'border-white/10'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Today's Check-In</h3>
                </div>

                {/* Live badge */}
                <AnimatePresence>
                    {liveTag && (
                        <motion.div
                            key="live"
                            initial={{ opacity: 0, scale: 0.8, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 10 }}
                            className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1"
                        >
                            <Wifi size={10} className="text-green-400 animate-pulse" />
                            <span className={`text-[10px] font-bold capitalize ${meta?.color || 'text-white'}`}>
                                {liveTag.status}
                            </span>
                            <span className="text-[9px] text-white/30 font-mono">
                                {formatTime(liveTag.time)}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Status / Check-In Area */}
            <AnimatePresence mode="wait">
                {hasStatus ? (
                    <motion.div
                        key={todayRecord.status}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        className="flex flex-col items-center text-center py-3 gap-2"
                    >
                        <div className={`w-14 h-14 rounded-full border flex items-center justify-center ${meta?.ring}`}>
                            {meta?.icon}
                        </div>
                        <p className={`font-bold text-sm ${meta?.color}`}>{meta?.label}</p>

                        {/* Time + source row */}
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            {todayRecord.checkInTime && (
                                <span className="text-white/50 text-xs font-mono tabular-nums">
                                    ⏱ {formatTime(todayRecord.checkInTime)}
                                </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold
                                ${todayRecord.markedBy === 'self'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}
                            >
                                {todayRecord.markedBy === 'self' ? 'Self Check-in' : 'Marked by Admin'}
                            </span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="notchecked"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center py-2 gap-3"
                    >
                        <p className="text-white/50 text-sm">Haven't checked in today yet</p>
                        <button
                            onClick={handleCheckIn}
                            disabled={checking}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(227,74,41,0.25)] hover:shadow-[0_0_25px_rgba(227,74,41,0.4)] disabled:opacity-60"
                        >
                            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {checking ? 'Checking in...' : 'CHECK IN NOW'}
                        </button>
                        {error && <p className="text-red-400 text-xs">{error}</p>}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Streak counter */}
            {streak > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-bold text-sm">{streak} Day Streak</span>
                    <span className="text-white/40 text-xs">Keep it up! 💪</span>
                </div>
            )}

            {/* 14-day mini calendar */}
            <div className="mt-4">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Last 14 Days</p>
                <div className="grid grid-cols-7 gap-1">
                    {calDays.map(({ dateStr, rec, isToday, dayOfWeek }, i) => (
                        <div key={dateStr} className="flex flex-col items-center gap-0.5">
                            {i < 7 && <span className="text-[8px] text-white/20 uppercase">{DAY_LABELS[dayOfWeek]}</span>}
                            <div
                                title={`${dateStr}${rec ? ` — ${rec.status}${rec.checkInTime ? ' · ' + formatTime(rec.checkInTime) : ''}` : ''}`}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all
                                    ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-black' : ''}
                                    ${rec?.status === 'present'
                                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                        : rec?.status === 'absent'
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400/50'
                                        : rec?.status === 'late'
                                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                        : 'bg-white/5 border-white/10 text-white/20'
                                    }`}
                            >
                                {new Date(dateStr + 'T00:00:00Z').getUTCDate()}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 mt-2 justify-center flex-wrap">
                    {[
                        { color: 'bg-green-500/30 border-green-500/40', label: 'Present' },
                        { color: 'bg-yellow-500/20 border-yellow-500/30', label: 'Late' },
                        { color: 'bg-red-500/10 border-red-500/20', label: 'Absent' },
                        { color: 'bg-white/5 border-white/10', label: 'No data' },
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full border ${l.color}`} />
                            <span className="text-[9px] text-white/30">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CheckInCard;
