import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, User, Phone, Mail, Calendar, Package, Clock,
    CheckCircle, XCircle, Edit, Trash2, History, Shield,
    Activity, CreditCard, ToggleLeft, ToggleRight, Save, X,
    AlertTriangle, TrendingUp, Award, Dumbbell
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtInput = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch { return ''; }
};

const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
};

// ─── sub-components ──────────────────────────────────────────────────────────
const InfoCard = ({ icon: Icon, label, value, color = 'gray' }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-${color}-100`}>
            <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5 break-all">{value || '—'}</p>
        </div>
    </div>
);

const StatusPill = ({ active, large = false }) => (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${large ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'} ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
        {active ? <CheckCircle className={large ? 'w-4 h-4' : 'w-3 h-3'} /> : <XCircle className={large ? 'w-4 h-4' : 'w-3 h-3'} />}
        {active ? 'Active' : 'Expired'}
    </span>
);

// ─── main component ──────────────────────────────────────────────────────────
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

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/admin/users', { headers });
            const found = data.find(u => u._id === userId);
            if (!found) { navigate('/admin/users'); return; }
            setUser(found);
            setEditData(found);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const { data } = await axios.get(`/api/attendance/admin/report?userId=${userId}`, { headers });
            setAttendance(Array.isArray(data) ? data : data.records || []);
        } catch {
            setAttendance([]);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchAttendance();
    }, [userId]);

    // ── actions ──────────────────────────────────────────────────────────────

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: updated } = await axios.put(`/api/admin/users/${userId}`, editData, { headers });
            const merged = { ...updated, latestMembership: editData.latestMembership, allMemberships: editData.allMemberships };
            setUser(merged);
            setEditing(false);
        } catch {
            alert('Error updating user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete ${user.name}? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/admin/users/${userId}`, { headers });
            navigate('/admin/users');
        } catch {
            alert('Error deleting user');
            setDeleting(false);
        }
    };

    const handleTogglePending = async () => {
        setTogglingPending(true);
        try {
            const { data } = await axios.put(`/api/admin/users/${userId}/toggle-pending`, {}, { headers });
            setUser(prev => ({ ...prev, allowPendingPayment: data.user.allowPendingPayment }));
        } catch {
            alert('Error updating pending payment permission');
        } finally {
            setTogglingPending(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
            Loading member profile…
        </div>
    );

    if (!user) return (
        <div className="text-center py-20 text-gray-400">User not found.</div>
    );

    const m = user.latestMembership;
    const daysLeft = m ? getRemainingDays(m.endDate) : null;
    const isActive = daysLeft !== null && daysLeft > 0;
    const totalSpent = user.allMemberships?.reduce((s, mem) => s + (mem.amountPaid || 0), 0) || 0;
    const presentDays = attendance.filter(a => a.status === 'present').length;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">

            {/* ── Back button ── */}
            <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Users
            </button>

            {/* ── Profile Hero Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
                </div>

                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-2xl border-4 border-white bg-gray-100 shadow-lg overflow-hidden shrink-0">
                            {user.profileImage?.url ? (
                                <img src={user.profileImage.url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                                    <User className="w-10 h-10 text-blue-400" />
                                </div>
                            )}
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {user.role === 'admin' ? '👑 Admin' : '🏋️ Member'}
                                </span>
                                <StatusPill active={isActive} large />
                            </div>
                            <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 sm:shrink-0">
                            <button
                                onClick={() => { setEditing(true); setEditData(user); }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Edit className="w-4 h-4" /> Edit Profile
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                        {[
                            { label: 'Days Left', value: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : 'Expired') : '—', color: daysLeft > 7 ? 'text-green-600' : daysLeft > 0 ? 'text-orange-500' : 'text-red-500' },
                            { label: 'Total Plans', value: user.allMemberships?.length || 0, color: 'text-blue-600' },
                            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-indigo-600' },
                            { label: 'Attendance', value: `${presentDays} days`, color: 'text-emerald-600' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                <p className={`text-xl font-bold ${color}`}>{value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Personal Details */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal Info
                    </h2>
                    <InfoCard icon={Phone} label="Phone" value={user.phone || 'Not provided'} color="blue" />
                    <InfoCard icon={Mail} label="Email" value={user.email} color="indigo" />
                    <InfoCard icon={Calendar} label="Date of Birth" value={fmt(user.dob)} color="purple" />
                    <InfoCard icon={Calendar} label="Joining Date" value={fmt(user.registrationDate || user.createdAt)} color="emerald" />
                    <InfoCard icon={Clock} label="Batch Time" value={user.batchTime && user.batchTime !== 'Not Assigned' ? user.batchTime : 'Not Assigned'} color="amber" />
                    <InfoCard icon={Shield} label="Role" value={user.role?.toUpperCase()} color="violet" />

                    {/* Allow Pending Payment Toggle */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Allow Pending Payment</p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">
                                    {user.allowPendingPayment !== false ? '✅ Allowed' : '❌ Disabled'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {user.allowPendingPayment !== false ? 'Member can pay later' : 'Must pay upfront'}
                                </p>
                            </div>
                            <button
                                onClick={handleTogglePending}
                                disabled={togglingPending}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${user.allowPendingPayment !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                            >
                                {user.allowPendingPayment !== false
                                    ? <ToggleRight className="w-4 h-4" />
                                    : <ToggleLeft className="w-4 h-4" />}
                                {togglingPending ? 'Saving…' : (user.allowPendingPayment !== false ? 'Allow' : 'Disabled')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Membership + Plan History + Attendance */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Current Membership */}
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4" /> Current Membership
                    </h2>
                    {m ? (
                        <div className={`rounded-2xl border-2 p-5 ${isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Plan</p>
                                    <h3 className="text-xl font-bold text-gray-900 mt-0.5">{m.packageName}</h3>
                                </div>
                                <StatusPill active={isActive} large />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { label: 'Start Date', value: fmt(m.startDate), icon: Calendar },
                                    { label: 'End Date', value: fmt(m.endDate), icon: Calendar },
                                    { label: 'Duration', value: m.planDuration ? `${m.planDuration} days` : '30 days', icon: Clock },
                                    { label: 'Amount Paid', value: m.amountPaid ? `₹${m.amountPaid.toLocaleString('en-IN')}` : '—', icon: CreditCard },
                                    { label: 'Days Left', value: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : 'Expired') : '—', icon: Activity },
                                    { label: 'Payment Method', value: m.paymentMethod || '—', icon: CreditCard },
                                ].map(({ label, value, icon: Icon }) => (
                                    <div key={label} className="bg-white/70 rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                                            <Icon className="w-3 h-3" />{label}
                                        </p>
                                        <p className="text-sm font-bold text-gray-800 mt-1">{value}</p>
                                    </div>
                                ))}
                            </div>
                            {!isActive && (
                                <div className="mt-4 flex items-center gap-2 bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-medium">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    Membership expired — please renew this member's plan.
                                </div>
                            )}
                            {isActive && daysLeft <= 7 && (
                                <div className="mt-4 flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-xs font-medium">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left — remind the member to renew.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50">
                            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 font-medium">No active membership plan</p>
                            <p className="text-gray-300 text-xs mt-1">Assign a plan from the Payments section.</p>
                        </div>
                    )}

                    {/* Plan History */}
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 pt-2">
                        <TrendingUp className="w-4 h-4" /> Plan History ({user.allMemberships?.length || 0} plans)
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {(!user.allMemberships || user.allMemberships.length === 0) ? (
                            <div className="text-center py-10 text-gray-300">
                                <Award className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">No plan history found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                            <th className="px-4 py-3 text-left">#</th>
                                            <th className="px-4 py-3 text-left">Plan</th>
                                            <th className="px-4 py-3 text-left">Duration</th>
                                            <th className="px-4 py-3 text-left">Start</th>
                                            <th className="px-4 py-3 text-left">End</th>
                                            <th className="px-4 py-3 text-left">Amount</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {user.allMemberships.map((mem, idx) => {
                                            const dl = getRemainingDays(mem.endDate);
                                            const active = dl !== null && dl > 0;
                                            return (
                                                <tr key={mem._id || idx} className={idx === 0 ? 'bg-blue-50/40' : 'hover:bg-gray-50'}>
                                                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                                                        {user.allMemberships.length - idx}
                                                        {idx === 0 && <span className="ml-1 text-[10px] text-blue-500 font-bold">LATEST</span>}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-gray-800">{mem.packageName}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{mem.planDuration ? `${mem.planDuration} days` : '30 days'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(mem.startDate)}</td>
                                                    <td className="px-4 py-3 text-xs">
                                                        <span className={active ? 'text-gray-700' : 'text-red-500 font-medium'}>{fmt(mem.endDate)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-700">₹{mem.amountPaid?.toLocaleString('en-IN') || '0'}</td>
                                                    <td className="px-4 py-3"><StatusPill active={active} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t border-gray-100">
                                            <td colSpan={5} className="px-4 py-2 text-xs text-gray-400">
                                                {user.allMemberships.length} plan{user.allMemberships.length !== 1 ? 's' : ''} total
                                            </td>
                                            <td colSpan={2} className="px-4 py-2 text-xs font-bold text-gray-700">
                                                Total: ₹{totalSpent.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Attendance Log */}
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 pt-2">
                        <Dumbbell className="w-4 h-4" /> Attendance ({presentDays} days present)
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {attendance.length === 0 ? (
                            <div className="text-center py-10 text-gray-300">
                                <Activity className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">No attendance records found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                            <th className="px-4 py-3 text-left">Date</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Check-in Time</th>
                                            <th className="px-4 py-3 text-left">Marked By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {attendance.slice(0, 30).map((rec) => (
                                            <tr key={rec._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 font-medium text-gray-700">{fmt(rec.date)}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rec.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                                                        {rec.status === 'present' ? '✅ Present' : '❌ Absent'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-400 text-xs">
                                                    {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-400 text-xs capitalize">{rec.markedBy || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {attendance.length > 30 && (
                                    <p className="text-center text-xs text-gray-400 py-3">Showing last 30 of {attendance.length} records</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Edit Modal ── */}
            {editing && editData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">Edit Member</h2>
                            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', required: true },
                                { label: 'Email', key: 'email', type: 'email', required: true },
                                { label: 'Phone', key: 'phone', type: 'text' },
                                { label: 'Date of Birth', key: 'dob', type: 'date' },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <input
                                        type={type} required={required}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={type === 'date' ? fmtInput(editData[key]) : (editData[key] || '')}
                                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                    />
                                </div>
                            ))}

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                <label className="block text-sm font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Registration / Joining Date
                                    <span className="ml-auto text-[10px] font-normal text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Admin only</span>
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                    value={fmtInput(editData.registrationDate || editData.createdAt)}
                                    onChange={(e) => setEditData({ ...editData, registrationDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Time</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editData.batchTime || ''}
                                    onChange={(e) => setEditData({ ...editData, batchTime: e.target.value })}
                                >
                                    <option value="">Not Assigned</option>
                                    <option value="5:30 AM to 7:30 am">5:30 AM to 7:30 am</option>
                                    <option value="7:30 am to 9:30 am">7:30 am to 9:30 am</option>
                                    <option value="5:00PM  to 7:00 pm">5:00PM  to 7:00 pm</option>
                                    <option value="7:00PM  to 9:00 pm">7:00PM  to 9:00 pm</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editData.role || 'user'}
                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setEditing(false)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-60">
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
