import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Flame, CalendarDays, Loader2, Wifi } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import socket from '../../utils/socket';

function todayStr() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CheckInCard = () => {
    const { token } = useContext(AuthContext);
    const [checkedIn, setCheckedIn]   = useState(false);
    const [checkInTime, setCheckInTime] = useState(null);
    const [streak, setStreak]         = useState(0);
    const [history, setHistory]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [checking, setChecking]     = useState(false);
    const [error, setError]           = useState('');
    const [liveFlash, setLiveFlash]   = useState(false);

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

            // Check if today is present
            const today = todayStr();
            const todayRecord = (records || []).find(r => r.date === today && r.status === 'present');
            setCheckedIn(!!todayRecord);
            setCheckInTime(todayRecord?.checkInTime || null);
        } catch (err) {
            console.error('CheckInCard fetch error:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    // Listen for real-time admin mark updates (e.g. admin marks this member present)
    useEffect(() => {
        const handler = () => {
            setLiveFlash(true);
            fetchStatus(true);
            setTimeout(() => setLiveFlash(false), 2000);
        };
        socket.on('attendance_update', handler);
        return () => socket.off('attendance_update', handler);
    }, [fetchStatus]);

    const handleCheckIn = async () => {
        if (checkedIn || checking) return;
        setChecking(true);
        setError('');
        try {
            const res = await axios.post('/api/attendance/checkin', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { record } = res.data;
            setCheckedIn(true);
            setCheckInTime(record?.checkInTime || new Date());
            setStreak(s => s + 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    // Build last 14 days calendar for display
    const calDays = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000 - (13 - i) * 86400000);
        const dateStr = ist.toISOString().slice(0, 10);
        const rec = history.find(r => r.date === dateStr);
        const isToday = dateStr === todayStr();
        const dayOfWeek = ist.getUTCDay();
        return { dateStr, rec, isToday, dayOfWeek };
    });

    if (loading) {
        return (
            <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className={`glass-card p-6 rounded-2xl border transition-all duration-500 ${liveFlash ? 'border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'border-white/10'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Today's Check-In</h3>
                </div>
                {liveFlash && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 text-[10px] text-green-400 font-semibold"
                    >
                        <Wifi size={10} className="animate-pulse" /> Live
                    </motion.span>
                )}
            </div>

            {/* Check-In Status + Button */}
            <AnimatePresence mode="wait">
                {checkedIn ? (
                    <motion.div
                        key="checked"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center py-3 gap-2"
                    >
                        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-green-400" />
                        </div>
                        <p className="text-green-400 font-bold text-sm">You're Checked In!</p>
                        {checkInTime && (
                            <p className="text-white/40 text-xs">
                                {new Date(checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="notchecked"
                        initial={{ opacity: 0, scale: 0.95 }}
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

            {/* Streak */}
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
                            {i < 7 && (
                                <span className="text-[8px] text-white/20 uppercase">{DAY_LABELS[dayOfWeek]}</span>
                            )}
                            <div
                                title={dateStr}
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
                <div className="flex items-center gap-3 mt-2 justify-center">
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
