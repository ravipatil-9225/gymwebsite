import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../../utils/socket';
import {
    ArrowLeft, User, Phone, Mail, Calendar, Package, Clock,
    CheckCircle, XCircle, Edit, Trash2, Shield,
    Activity, CreditCard, ToggleLeft, ToggleRight, Save, X,
    AlertTriangle, TrendingUp, Award, Dumbbell, RefreshCw
} from 'lucide-react';

const fmt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtInput = (dateStr) => {
    if (!dateStr) return '';
    try { const d = new Date(dateStr); if (isNaN(d.getTime())) return ''; return d.toISOString().split('T')[0]; }
    catch { return ''; }
};
const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
};

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [togglingPending, setTogglingPending] = useState(false);

    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchUser = useCallback(async (silent = false) => {
        try {
            const { data } = await axios.get('/api/admin/users', { headers });
            const found = data.find(u => u._id === userId);
            if (!found) { navigate('/admin/users'); return; }
            setUser(found);
            if (!silent) { setEditData(found); setLoading(false); }
        } catch (err) { console.error(err); if (!silent) setLoading(false); }
    }, [userId]);

    const fetchAttendance = useCallback(async () => {
        try {
            const { data } = await axios.get(`/api/attendance/admin/report?userId=${userId}`, { headers });
            setAttendance(Array.isArray(data) ? data : data.records || []);
        } catch { setAttendance([]); }
    }, [userId]);

    useEffect(() => {
        fetchUser(); fetchAttendance();
        const onDbChange = () => { if (!editing) { fetchUser(true); fetchAttendance(); } };
        socket.on('db_changed', onDbChange);
        const interval = setInterval(() => { if (!editing) { fetchUser(true); fetchAttendance(); } }, 5000);
        return () => { clearInterval(interval); socket.off('db_changed', onDbChange); };
    }, [userId, editing]);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const { data: updated } = await axios.put(`/api/admin/users/${userId}`, editData, { headers });
            setUser({ ...updated, latestMembership: editData.latestMembership, allMemberships: editData.allMemberships });
            setEditing(false); fetchUser(true);
        } catch { alert('Error updating user'); } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
        setDeleting(true);
        try { await axios.delete(`/api/admin/users/${userId}`, { headers }); navigate('/admin/users'); }
        catch { alert('Error deleting user'); setDeleting(false); }
    };

    const handleTogglePending = async () => {
        setTogglingPending(true);
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/toggle-pending`, {}, { headers });
            setUser(prev => ({ ...prev, allowPendingPayment: data.user.allowPendingPayment }));
            fetchUser(true);
        } catch { alert('Error updating pending payment permission'); } finally { setTogglingPending(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading member profile…</p>
        </div>
    );
    if (!user) return <div className="text-center py-20 text-gray-400">User not found.</div>;

    const m = user.latestMembership;
    const daysLeft = m ? getRemainingDays(m.endDate) : null;
    const isActive = daysLeft !== null && daysLeft > 0;
    const totalSpent = user.allMemberships?.reduce((s, mem) => s + (mem.amountPaid || 0), 0) || 0;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const daysColor = daysLeft === null ? 'text-gray-400' : daysLeft <= 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-emerald-500';

    return (
        <div className="max-w-6xl mx-auto space-y-5 pb-10">

            {/* Back */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Users
                </button>
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    <RefreshCw className="w-3 h-3" style={{ animation: 'spin 3s linear infinite' }} /> Live sync
                </span>
            </div>

            {/* HERO */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white">

                {/* Banner + Avatar Row — all inside one flex */}
                <div className="relative" style={{ background: isActive ? 'linear-gradient(135deg,#1e3a5f 0%,#1a56db 55%,#0e9f6e 100%)' : 'linear-gradient(135deg,#1f2937 0%,#374151 55%,#6b7280 100%)' }}>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 50%,rgba(255,255,255,0.07) 0%,transparent 50%),radial-gradient(circle at 85% 20%,rgba(255,255,255,0.09) 0%,transparent 40%)' }} />

                    <div className="relative px-6 py-5 flex items-center gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-2xl border-4 border-white/30 shadow-2xl overflow-hidden shrink-0 bg-gradient-to-br from-white/20 to-white/10">
                            {user.profileImage?.url
                                ? <img src={user.profileImage.url} alt={user.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><User className="w-9 h-9 text-white/60" /></div>}
                        </div>

                        {/* Name + info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black text-white tracking-tight drop-shadow">{user.name}</h1>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border backdrop-blur-sm ${user.role === 'admin' ? 'bg-violet-500/30 text-violet-100 border-violet-400/40' : 'bg-white/15 text-white/80 border-white/25'}`}>
                                    {user.role === 'admin' ? '👑 Admin' : '🏋️ Member'}
                                </span>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border backdrop-blur-sm flex items-center gap-1 ${isActive ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200' : 'bg-red-500/25 border-red-400/40 text-red-200'}`}>
                                    {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {isActive ? 'Active' : 'Expired'}
                                </span>
                            </div>
                            <p className="text-white/60 text-sm">{user.email}</p>
                            {user.phone && <p className="text-white/80 text-sm font-semibold mt-0.5">{user.phone}</p>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => { setEditing(true); setEditData(user); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-xl text-sm font-black transition-all shadow-lg hover:bg-indigo-50 hover:-translate-y-0.5 active:translate-y-0">
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/80 text-white border border-white/20 rounded-xl text-sm font-black transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                                <Trash2 className="w-4 h-4" /> {deleting ? '…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-t border-gray-100">
                    {[
                        { label: 'Days Left', value: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}` : '0') : '—', unit: daysLeft > 0 ? 'days' : (daysLeft === 0 ? 'expired' : ''), vc: daysColor, icon: '⏳' },
                        { label: 'Total Plans', value: user.allMemberships?.length || 0, unit: 'plans', vc: 'text-indigo-600', icon: '📋' },
                        { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, unit: '', vc: 'text-violet-700', icon: '💰' },
                        { label: 'Attendance', value: presentDays, unit: 'days', vc: 'text-emerald-600', icon: '✅' },
                    ].map(({ label, value, unit, vc, icon }) => (
                        <div key={label} className="p-4 text-center hover:bg-gray-50 transition-colors">
                            <p className={`text-xl font-black ${vc}`}>
                                {value}
                                {unit ? <span className="text-xs font-semibold ml-1 text-gray-400">{unit}</span> : null}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{icon} {label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* LEFT */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-700 to-slate-600 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-white/70" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Personal Info</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[
                                { icon: Phone, label: 'Phone', value: user.phone || 'Not provided', ib: 'bg-sky-100', ic: 'text-sky-600' },
                                { icon: Mail, label: 'Email', value: user.email, ib: 'bg-indigo-100', ic: 'text-indigo-600' },
                                { icon: Calendar, label: 'Date of Birth', value: fmt(user.dob), ib: 'bg-purple-100', ic: 'text-purple-600' },
                                { icon: Calendar, label: 'Joining Date', value: fmt(user.registrationDate || user.createdAt), ib: 'bg-emerald-100', ic: 'text-emerald-600' },
                                { icon: Clock, label: 'Batch Time', value: (user.batchTime && user.batchTime !== 'Not Assigned') ? user.batchTime : 'Not Assigned', ib: 'bg-amber-100', ic: 'text-amber-600' },
                                { icon: Shield, label: 'Role', value: user.role?.toUpperCase(), ib: 'bg-violet-100', ic: 'text-violet-600' },
                            ].map(({ icon: Icon, label, value, ib, ic }) => (
                                <div key={label} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ib}`}><Icon className={`w-3.5 h-3.5 ${ic}`} /></div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-300">{label}</p>
                                        <p className="text-sm font-semibold text-gray-800 truncate">{value || '—'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`rounded-2xl overflow-hidden border-2 shadow-sm ${user.allowPendingPayment !== false ? 'border-emerald-200' : 'border-rose-200'}`}>
                        <div className={`px-5 py-3 flex items-center gap-2 ${user.allowPendingPayment !== false ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                            <CreditCard className="w-3.5 h-3.5 text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Pending Payment</span>
                        </div>
                        <div className={`p-5 flex items-center justify-between ${user.allowPendingPayment !== false ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <div>
                                <p className={`text-sm font-black ${user.allowPendingPayment !== false ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {user.allowPendingPayment !== false ? '✅ Allowed' : '❌ Disabled'}
                                </p>
                                <p className={`text-xs mt-0.5 ${user.allowPendingPayment !== false ? 'text-emerald-500' : 'text-rose-400'}`}>
                                    {user.allowPendingPayment !== false ? 'Can pay later' : 'Must pay upfront'}
                                </p>
                            </div>
                            <button onClick={handleTogglePending} disabled={togglingPending}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border shadow-sm transition-all hover:-translate-y-0.5 ${user.allowPendingPayment !== false ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700' : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'}`}>
                                {user.allowPendingPayment !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                {togglingPending ? '…' : (user.allowPendingPayment !== false ? 'Allow' : 'Enable')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="lg:col-span-8 space-y-5">

                    {/* Membership */}
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className={`px-5 py-3.5 flex items-center gap-2 ${isActive ? 'bg-gradient-to-r from-blue-700 to-indigo-600' : 'bg-gradient-to-r from-gray-600 to-gray-500'}`}>
                            <Package className="w-4 h-4 text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Current Membership</span>
                            <span className={`ml-auto text-[10px] font-black px-2.5 py-1 rounded-full ${isActive ? 'bg-emerald-400/30 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
                                {isActive ? '🟢 ACTIVE' : '🔴 EXPIRED'}
                            </span>
                        </div>
                        <div className="bg-white p-5">
                            {m ? (
                                <>
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                        <div>
                                            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">Plan</p>
                                            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{m.packageName}</h3>
                                        </div>
                                        {!isActive && <div className="flex items-center gap-1.5 bg-red-50 text-red-500 text-xs font-black px-3 py-1.5 rounded-lg border border-red-100"><AlertTriangle className="w-3.5 h-3.5" /> Renewal Required</div>}
                                        {isActive && daysLeft <= 7 && <div className="flex items-center gap-1.5 bg-orange-50 text-orange-500 text-xs font-black px-3 py-1.5 rounded-lg border border-orange-100"><AlertTriangle className="w-3.5 h-3.5" /> Expiring in {daysLeft}d</div>}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Start Date', value: fmt(m.startDate), bg: 'bg-sky-50', b: 'border-sky-100', vc: 'text-sky-800', lc: 'text-sky-400', icon: '📅' },
                                            { label: 'End Date', value: fmt(m.endDate), bg: isActive ? 'bg-slate-50' : 'bg-red-50', b: isActive ? 'border-slate-100' : 'border-red-100', vc: isActive ? 'text-slate-800' : 'text-red-600', lc: isActive ? 'text-slate-400' : 'text-red-300', icon: '📅' },
                                            { label: 'Duration', value: m.planDuration ? `${m.planDuration} days` : '30 days', bg: 'bg-violet-50', b: 'border-violet-100', vc: 'text-violet-800', lc: 'text-violet-400', icon: '⏱️' },
                                            { label: 'Amount Paid', value: m.amountPaid ? `₹${m.amountPaid.toLocaleString('en-IN')}` : '—', bg: 'bg-emerald-50', b: 'border-emerald-100', vc: 'text-emerald-800', lc: 'text-emerald-400', icon: '💰' },
                                            { label: 'Days Left', value: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : 'Expired') : '—', bg: daysLeft > 7 ? 'bg-green-50' : daysLeft > 0 ? 'bg-orange-50' : 'bg-red-50', b: daysLeft > 7 ? 'border-green-100' : daysLeft > 0 ? 'border-orange-100' : 'border-red-100', vc: daysLeft > 7 ? 'text-green-700' : daysLeft > 0 ? 'text-orange-600' : 'text-red-600', lc: daysLeft > 7 ? 'text-green-400' : 'text-orange-300', icon: '⏳' },
                                            { label: 'Payment Method', value: m.paymentMethod || '—', bg: 'bg-indigo-50', b: 'border-indigo-100', vc: 'text-indigo-800', lc: 'text-indigo-400', icon: '💳' },
                                        ].map(({ label, value, bg, b, vc, lc, icon }) => (
                                            <div key={label} className={`${bg} border ${b} rounded-xl p-3.5`}>
                                                <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${lc}`}>{icon} {label}</p>
                                                <p className={`text-sm font-black ${vc}`}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Package className="w-8 h-8 text-gray-300" /></div>
                                    <p className="text-gray-400 font-bold">No active membership plan</p>
                                    <p className="text-gray-300 text-sm mt-1">Assign a plan from the Payments section.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Plan History */}
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="px-5 py-3.5 flex items-center gap-2 bg-gradient-to-r from-violet-700 to-purple-600">
                            <TrendingUp className="w-4 h-4 text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Plan History</span>
                            <span className="ml-auto text-[10px] font-black text-white bg-white/20 px-2.5 py-0.5 rounded-full">{user.allMemberships?.length || 0} plans · ₹{totalSpent.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-white">
                            {(!user.allMemberships || user.allMemberships.length === 0) ? (
                                <div className="text-center py-12"><Award className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-gray-300 font-semibold text-sm">No plan history found.</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">{['#','Plan','Duration','Start','End','Amount','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
                                        <tbody>
                                            {user.allMemberships.map((mem, idx) => {
                                                const dl = getRemainingDays(mem.endDate);
                                                const active = dl !== null && dl > 0;
                                                return (
                                                    <tr key={mem._id || idx} className={`border-b border-gray-50 transition-colors ${idx === 0 ? 'bg-violet-50/50' : 'hover:bg-gray-50'}`}>
                                                        <td className="px-4 py-3"><span className="text-xs font-black text-gray-300 font-mono">{user.allMemberships.length - idx}</span>{idx === 0 && <span className="ml-1 text-[9px] bg-violet-100 text-violet-600 font-black px-1.5 py-0.5 rounded-full">LATEST</span>}</td>
                                                        <td className="px-4 py-3 font-bold text-gray-800">{mem.packageName}</td>
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{mem.planDuration ? `${mem.planDuration}d` : '30d'}</td>
                                                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(mem.startDate)}</td>
                                                        <td className="px-4 py-3 text-xs"><span className={active ? 'text-gray-600' : 'text-red-500 font-semibold'}>{fmt(mem.endDate)}</span></td>
                                                        <td className="px-4 py-3 font-bold text-gray-700">₹{mem.amountPaid?.toLocaleString('en-IN') || '0'}</td>
                                                        <td className="px-4 py-3"><span className={`text-[10px] font-black px-2 py-1 rounded-full ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{active ? `✓ ${dl}d left` : '✗ Expired'}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attendance */}
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className="px-5 py-3.5 flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-500">
                            <Dumbbell className="w-4 h-4 text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Attendance Log</span>
                            <span className="ml-auto text-[10px] font-black text-white bg-white/20 px-2.5 py-0.5 rounded-full">{presentDays} days present</span>
                        </div>
                        <div className="bg-white">
                            {attendance.length === 0 ? (
                                <div className="text-center py-12"><Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-gray-300 font-semibold text-sm">No attendance records found.</p></div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">{['Date','Status','Check-in Time','Marked By'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
                                        <tbody>
                                            {attendance.slice(0, 30).map((rec) => (
                                                <tr key={rec._id} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-gray-700">{fmt(rec.date)}</td>
                                                    <td className="px-4 py-3"><span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${rec.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500'}`}>{rec.status === 'present' ? '✓ Present' : '✗ Absent'}</span></td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs capitalize">{rec.markedBy || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {attendance.length > 30 && <p className="text-center text-xs text-gray-300 py-3 font-semibold">Showing last 30 of {attendance.length} records</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {editing && editData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-100" style={{ maxHeight: '90vh' }}>
                        <div className="px-6 py-4 flex justify-between items-center shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
                            <h2 className="text-sm font-black text-white flex items-center gap-2"><Edit className="w-4 h-4" /> Edit Member Profile</h2>
                            <button onClick={() => setEditing(false)} className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', required: true },
                                { label: 'Email', key: 'email', type: 'email', required: true },
                                { label: 'Phone', key: 'phone', type: 'text' },
                                { label: 'Date of Birth', key: 'dob', type: 'date' },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
                                    <input type={type} required={required}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all"
                                        value={type === 'date' ? fmtInput(editData[key]) : (editData[key] || '')}
                                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} />
                                </div>
                            ))}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <label className="flex items-center gap-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                                    <Calendar className="w-3 h-3" /> Registration / Joining Date
                                    <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black">ADMIN ONLY</span>
                                </label>
                                <input type="date" className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-white"
                                    value={fmtInput(editData.registrationDate || editData.createdAt)}
                                    onChange={(e) => setEditData({ ...editData, registrationDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Batch Time</label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-gray-50 focus:bg-white"
                                    value={editData.batchTime || ''} onChange={(e) => setEditData({ ...editData, batchTime: e.target.value })}>
                                    <option value="">Not Assigned</option>
                                    <option value="5:30 AM to 7:30 am">5:30 AM to 7:30 am</option>
                                    <option value="7:30 am to 9:30 am">7:30 am to 9:30 am</option>
                                    <option value="5:00PM  to 7:00 pm">5:00PM  to 7:00 pm</option>
                                    <option value="7:00PM  to 9:00 pm">7:00PM  to 9:00 pm</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-gray-50 focus:bg-white"
                                    value={editData.role || 'user'} onChange={(e) => setEditData({ ...editData, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 font-black flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-md shadow-indigo-200">
                                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
