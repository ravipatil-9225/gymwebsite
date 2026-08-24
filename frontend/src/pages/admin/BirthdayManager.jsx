import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    Cake, Phone, Mail, Users, RefreshCw, Wifi, Clock, User,
    PartyPopper, ExternalLink, MessageSquare
} from 'lucide-react';
import socket from '../../utils/socket';
import { Link } from 'react-router-dom';

/* ── helpers ─────────────────────────────────────────────────── */
function todayLabel() {
    return new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatDob(dob) {
    if (!dob) return '—';
    try {
        const d = new Date(dob + 'T00:00:00');
        if (!isNaN(d)) return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (_) {}
    return dob;
}

function waLink(phone, name) {
    if (!phone) return null;
    const num = phone.replace(/[^0-9]/g, '').replace(/^(?!91)/, '91');
    const msg = encodeURIComponent(
        `🎂 Happy Birthday ${name}! 🎉\n\nWishing you a fantastic birthday from all of us at Tara Fitness! Stay strong and keep crushing your goals! 💪🏋️`
    );
    return `https://wa.me/${num}?text=${msg}`;
}

/* ── Avatar ──────────────────────────────────────────────────── */
const Avatar = ({ user }) => {
    const initials = user.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    return user.profileImage?.url ? (
        <img
            src={user.profileImage.url}
            alt={user.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-pink-300/50 shadow-lg"
        />
    ) : (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-pink-300/50">
            {initials}
        </div>
    );
};

/* ── Birthday Card ───────────────────────────────────────────── */
const BirthdayCard = ({ user, index }) => {
    const wa = waLink(user.phone, user.name);

    return (
        <div
            className="relative bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-200 transition-all overflow-hidden group"
            style={{ animation: `fadeSlideUp 0.3s ease ${index * 0.05}s both` }}
        >
            {/* Festive top stripe */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300" />

            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Avatar with cake emoji */}
                    <div className="relative flex-shrink-0">
                        <Avatar user={user} />
                        <span className="absolute -bottom-1 -right-1 text-lg">🎂</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                                <Link
                                    to={`/admin/users/${user._id}`}
                                    className="font-bold text-gray-900 hover:text-pink-600 transition-colors text-base leading-tight flex items-center gap-1.5 hover:underline"
                                >
                                    {user.name}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {user.age && (
                                        <span className="text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-2.5 py-0.5 rounded-full shadow-sm">
                                            Turning {user.age} 🎉
                                        </span>
                                    )}
                                    {user.batchTime && user.batchTime !== 'Not Assigned' && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {user.batchTime}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact details */}
                        <div className="mt-3 space-y-1.5">
                            {user.email && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                            )}
                            {user.phone && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span>{user.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Cake className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>DOB: {formatDob(user.dob)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp wish button */}
                {wa && (
                    <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Send Birthday Wishes on WhatsApp
                    </a>
                )}
            </div>
        </div>
    );
};

/* ── Main Component ──────────────────────────────────────────── */
const BirthdayManager = () => {
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [liveFlash, setLiveFlash] = useState(false);

    const token = localStorage.getItem('adminToken');

    const fetchBirthdays = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const { data } = await axios.get('/api/admin/birthdays/today', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBirthdays(data.users || []);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Birthday fetch error:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchBirthdays();

        const onDbChange = () => {
            fetchBirthdays(true);
            setLiveFlash(true);
            setTimeout(() => setLiveFlash(false), 3000);
        };

        socket.on('db_changed', onDbChange);
        const interval = setInterval(() => fetchBirthdays(true), 60000);

        return () => {
            socket.off('db_changed', onDbChange);
            clearInterval(interval);
        };
    }, [fetchBirthdays]);

    return (
        <div className="space-y-6">
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes liveFlash {
                    0%,100% { opacity:1; } 50% { opacity:0.5; }
                }
                .live-flash { animation: liveFlash 0.6s ease 3; }
            `}</style>

            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 rounded-2xl p-6 shadow-lg">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Cake className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">
                                🎂 Today's Birthdays
                            </h1>
                            <p className="text-pink-100 text-sm mt-0.5">{todayLabel()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {liveFlash && (
                            <div className="live-flash flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                <Wifi className="w-3.5 h-3.5" />
                                Live Updated
                            </div>
                        )}

                        <button
                            onClick={() => fetchBirthdays()}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <div className="bg-white/20 backdrop-blur-sm text-white rounded-xl px-4 py-2 text-center min-w-[60px]">
                            <p className="text-2xl font-black leading-none">{birthdays.length}</p>
                            <p className="text-[10px] font-semibold text-pink-100 uppercase tracking-wider mt-0.5">
                                {birthdays.length === 1 ? 'Birthday' : 'Birthdays'}
                            </p>
                        </div>
                    </div>
                </div>

                {lastRefresh && (
                    <p className="relative text-pink-200 text-xs mt-4">
                        Last synced: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {' · '}Live data from production database
                    </p>
                )}
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" />
                    <p className="text-gray-500 text-sm">Loading today's birthdays…</p>
                </div>
            ) : birthdays.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <PartyPopper className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Birthdays Today</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                        No members have their birthday today. Check back tomorrow!
                    </p>
                    <p className="text-gray-300 text-xs mt-3">
                        This panel auto-refreshes every minute and syncs live via WebSocket.
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl">
                        <PartyPopper className="w-5 h-5 text-pink-500 flex-shrink-0" />
                        <p className="text-sm text-pink-700 font-medium">
                            🎉 <strong>{birthdays.length}</strong> {birthdays.length === 1 ? 'member has' : 'members have'} a birthday today! Send them warm wishes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {birthdays.map((user, i) => (
                            <BirthdayCard key={user._id} user={user} index={i} />
                        ))}
                    </div>
                </>
            )}

            {/* ── Footer note ── */}
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                <Wifi className="w-3.5 h-3.5" />
                <span>
                    Real-time sync enabled · Updates instantly when member data changes · Auto-refreshes daily at midnight
                </span>
            </div>
        </div>
    );
};

export default BirthdayManager;
