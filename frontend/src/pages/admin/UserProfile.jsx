import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../../utils/socket';
import {
    ArrowLeft, User, Phone, Mail, Calendar, Package, Clock,
    CheckCircle, XCircle, Edit, Trash2, Shield,
    Activity, CreditCard, ToggleLeft, ToggleRight, Save, X,
    AlertTriangle, TrendingUp, Award, Dumbbell, RefreshCw,
    MessageCircle, FileText, UtensilsCrossed, IndianRupee, ClipboardCheck, Send, ExternalLink, Plus, Loader2
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

// Design tokens
const CARD   = 'bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden';
const LBL    = 'text-[10px] font-semibold uppercase tracking-widest text-gray-500';
const SEC_TI = `text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-5 py-3 border-b border-[#1f2937]`;

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

    const [packages, setPackages] = useState([]);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [assignPkgId, setAssignPkgId] = useState('');
    const [assignPaymentMethod, setAssignPaymentMethod] = useState('cash_on_bench');
    const [assignStartDate, setAssignStartDate] = useState('');
    const [assigning, setAssigning] = useState(false);

    // ── Plan History CRUD ──────────────────────────────────────────────────────
    const [planForm, setPlanForm] = useState(null); // null | { mode: 'create'|'edit', data: {} }
    const [planSaving, setPlanSaving] = useState(false);
    const [planDeleting, setPlanDeleting] = useState(null);

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

    const fetchPackages = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/admin/packages', { headers });
            setPackages(data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchUser(); fetchAttendance(); fetchPackages();

        // ── db_changed: generic refetch (memberships, user data, bulk ops) ──
        const onDbChange = (payload) => {
            if (!editing) {
                fetchUser(true);
                // Only refetch attendance if the change is relevant to this user
                // or no specific userId is given (broadcast change)
                const changedUid = payload?.userId || payload?.user?._id;
                if (!changedUid || changedUid === userId) {
                    fetchAttendance();
                }
            }
        };

        // ── attendance_update: INSTANT per-user attendance patch ─────────────
        // Fires on every biometric punch, admin mark, self check-in, or delete.
        // We patch state in-place so the UI updates < 1s after the thumb scan.
        const onAttendanceUpdate = (payload) => {
            const record = payload?.record;
            if (!record) return;

            // Only handle records that belong to this user's profile
            const recordUid = record.userId?.toString() || record.userId;
            if (recordUid !== userId) return;

            if (payload.action === 'delete') {
                // Remove deleted record from the list
                setAttendance(prev => prev.filter(r => r._id?.toString() !== record._id?.toString()));
                return;
            }

            // Upsert: update existing record for same date, or prepend new one
            setAttendance(prev => {
                const existingIdx = prev.findIndex(r => r.date === record.date);
                if (existingIdx > -1) {
                    const updated = [...prev];
                    updated[existingIdx] = { ...updated[existingIdx], ...record };
                    return updated;
                }
                // New record — prepend (most recent first)
                return [record, ...prev];
            });
        };

        // ── Poll every 3s for any missed biometric punches ────────────────────
        // This is a safety net in case a socket event is missed (page load race).
        const interval = setInterval(() => {
            if (!editing) { fetchUser(true); fetchAttendance(); }
        }, 3000);

        socket.on('db_changed',        onDbChange);
        socket.on('attendance_update', onAttendanceUpdate);

        return () => {
            clearInterval(interval);
            socket.off('db_changed',        onDbChange);
            socket.off('attendance_update', onAttendanceUpdate);
        };
    }, [userId, editing, fetchAttendance, fetchUser]);

    // ── Plan History CRUD Handlers ─────────────────────────────────────────────
    const handlePlanSave = async (e) => {
        if (e) e.preventDefault();
        if (!planForm || !user) return;
        setPlanSaving(true);
        const token = localStorage.getItem('adminToken');
        try {
            const { mode, data } = planForm;
            if (mode === 'create') {
                await axios.post(
                    `/api/admin/users/${userId}/memberships`,
                    data,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.put(
                    `/api/admin/memberships/${data._id}`,
                    data,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            await fetchUser(true);
            setPlanForm(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving plan');
        } finally {
            setPlanSaving(false);
        }
    };

    const handlePlanDelete = async (membershipId) => {
        if (!window.confirm('Are you sure you want to delete this plan record? This cannot be undone.')) return;
        setPlanDeleting(membershipId);
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`/api/admin/memberships/${membershipId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUser(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting plan');
        } finally {
            setPlanDeleting(null);
        }
    };

    const handleAssignMembership = async (e, packageData = null) => {
        if (e) e.preventDefault();
        setAssigning(true);
        try {
            let payload = {};
            if (packageData) {
                payload = {
                    packageName: packageData.packageName,
                    planDuration: packageData.planDuration,
                    amountPaid: packageData.amountPaid,
                    paymentMethod: 'cash_on_bench'
                };
            } else {
                if (!assignPkgId) {
                    alert('Please select a plan');
                    setAssigning(false);
                    return;
                }
                payload = {
                    packageId: assignPkgId,
                    paymentMethod: assignPaymentMethod,
                    startDate: assignStartDate || undefined
                };
            }

            await axios.post(`/api/admin/users/${userId}/assign-membership`, payload, { headers });
            alert('Membership updated successfully!');
            setShowAssignForm(false);
            setAssignPkgId('');
            setAssignStartDate('');
            fetchUser(true);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error updating membership');
        } finally {
            setAssigning(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const { data: updated } = await axios.put(`/api/admin/users/${userId}`, editData, { headers });
            setUser({ ...updated, latestMembership: editData.latestMembership, allMemberships: editData.allMemberships });
            setEditing(false); fetchUser(true);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error updating user';
            alert(msg);
        } finally { setSaving(false); }
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
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-white animate-spin" />
            <p className="text-sm text-gray-500">Loading profile…</p>
        </div>
    );
    if (!user) return <div className="text-center py-20 text-gray-500">User not found.</div>;

    const m = user.latestMembership;
    const daysLeft = m ? getRemainingDays(m.endDate) : null;
    const isActive = daysLeft !== null && daysLeft > 0;
    const totalSpent = user.allMemberships?.reduce((s, mem) => s + (mem.amountPaid || 0), 0) || 0;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const waBase = user.phone
        ? `https://wa.me/${user.phone.replace(/[^0-9]/g, '').replace(/^(?!91)/, '91')}`
        : null;
    const waLink = (msg) => waBase ? `${waBase}?text=${encodeURIComponent(msg)}` : '#';

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#0f1117] -m-4 lg:-m-8 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-5 pb-12">

            {/* ── Top bar */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white text-sm font-medium transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Users
                </button>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
                    <RefreshCw className="w-3 h-3" style={{ animation: 'spin 4s linear infinite' }} />
                    Live sync
                </span>
            </div>

            {/* ── Hero card */}
            <div className={CARD}>
                <div className="p-6 flex items-start gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-[#1f2937] flex items-center justify-center border border-[#374151]">
                        {user.profileImage?.url
                            ? <img src={user.profileImage.url} alt={user.name} className="w-full h-full object-cover" />
                            : <User className="w-7 h-7 text-gray-600" />}
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h1 className="text-xl font-bold text-white tracking-tight">{user.name}</h1>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                user.role === 'admin'
                                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                                    : 'bg-[#1f2937] text-gray-500 border-[#374151]'}`}>
                                {user.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                {isActive ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                {isActive ? 'Active' : 'Expired'}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        {user.phone && <p className="text-gray-400 text-sm mt-0.5">{user.phone}</p>}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setEditing(true); setEditData(user); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-300 bg-[#1f2937] border border-[#374151] rounded-xl hover:bg-[#2d3748] hover:text-white transition-all">
                            <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={handleDelete} disabled={deleting}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50">
                            <Trash2 className="w-3.5 h-3.5" /> {deleting ? '…' : 'Delete'}
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 border-t border-[#1f2937] divide-x divide-[#1f2937]">
                    {[
                        { label: 'Days Left',   value: daysLeft !== null ? (daysLeft > 0 ? daysLeft : 0) : '—', color: daysLeft === null ? 'text-gray-500' : daysLeft <= 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-emerald-400' },
                        { label: 'Total Plans', value: user.allMemberships?.length || 0, color: 'text-white' },
                        { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-white' },
                        { label: 'Attendance',  value: `${presentDays}d`, color: 'text-white' },
                    ].map(({ label: l, value, color }) => (
                        <div key={l} className="py-4 text-center">
                            <p className={`text-lg font-bold ${color}`}>{value}</p>
                            <p className={`mt-0.5 ${LBL}`}>{l}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Left column */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Personal Info */}
                    <div className={CARD}>
                        <p className={SEC_TI}>Personal Info</p>
                        <div className="divide-y divide-[#1a2233]">
                            {[
                                { icon: Phone,    label: 'Phone',         value: user.phone || 'Not provided' },
                                { icon: Mail,     label: 'Email',         value: user.email },
                                { icon: User,     label: 'Biometric ID',  value: user.biometricCardId ? `#${user.biometricCardId}` : 'Not assigned' },
                                { icon: Calendar, label: 'Date of Birth', value: fmt(user.dob) },
                                { icon: Calendar, label: 'Joined',        value: fmt(user.registrationDate || user.createdAt) },
                                { icon: Clock,    label: 'Batch Time',    value: (user.batchTime && user.batchTime !== 'Not Assigned') ? user.batchTime : 'Not Assigned' },
                                { icon: Shield,   label: 'Role',          value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
                            ].map(({ icon: Icon, label: l, value }) => (
                                <div key={l} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#1a2233] transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className={LBL}>{l}</p>
                                        <p className="text-sm text-gray-300 mt-0.5 truncate">{value || '—'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Payment */}
                    <div className={CARD}>
                        <p className={SEC_TI}>Pending Payment</p>
                        <div className="px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-300">
                                    {user.allowPendingPayment !== false ? 'Allowed' : 'Disabled'}
                                </p>
                                <p className="text-[11px] text-gray-600 mt-0.5">
                                    {user.allowPendingPayment !== false ? 'Member can pay later' : 'Must pay upfront'}
                                </p>
                            </div>
                            <button onClick={handleTogglePending} disabled={togglingPending}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                                    user.allowPendingPayment !== false ? 'bg-emerald-500' : 'bg-[#2d3748]'}`}>
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                    user.allowPendingPayment !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* WhatsApp */}
                    <div className={CARD}>
                        <p className={SEC_TI}>WhatsApp</p>
                        {user.phone ? (
                            <div className="p-4 space-y-2">
                                <a href={waLink(`Hi ${user.name}, this is from Tara Fitness. `)}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 w-full px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all text-sm font-medium group">
                                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    Open WhatsApp Chat
                                    <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-40" />
                                </a>
                                <p className={`${LBL} px-1 pt-1`}>Quick Templates</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Invoice',    icon: FileText,        msg: `Hi ${user.name}, here is your invoice from Tara Fitness. Thank you! 💪` },
                                        { label: 'Diet Plan',  icon: UtensilsCrossed, msg: `Hi ${user.name}, here is your personalized diet plan from Tara Fitness. 🥗💪` },
                                        { label: 'Payment',    icon: IndianRupee,     msg: `Hi ${user.name}, gentle reminder regarding your pending payment at Tara Fitness. 🙏` },
                                        { label: 'Attendance', icon: ClipboardCheck,  msg: `Hi ${user.name}, we noticed your attendance has been irregular. We miss you! 💪🏋️` },
                                    ].map(({ label: l, icon: Icon, msg }) => (
                                        <a key={l} href={waLink(msg)} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2.5 bg-[#1a2233] border border-[#2d3748] rounded-xl hover:bg-[#232d42] hover:border-[#4a5568] text-gray-400 hover:text-gray-200 transition-all">
                                            <Icon className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-xs font-medium">{l}</span>
                                        </a>
                                    ))}
                                </div>
                                {!isActive && (
                                    <a href={waLink(`Hi ${user.name}, your membership at Tara Fitness has expired. Renew today! 🏋️‍♂️🔥`)}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/15 transition-all text-sm font-medium">
                                        <AlertTriangle className="w-4 h-4" />
                                        Renewal Reminder
                                        <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-40" />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Phone className="w-5 h-5 text-gray-700 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">No phone number on record</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-8 space-y-5">

                    {/* Current Membership */}
                    <div className={CARD}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2937]">
                            <p className={LBL}>Current Membership</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isActive
                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                {isActive ? 'Active' : 'Expired'}
                            </span>
                        </div>
                        <div className="p-5">
                            {m ? (
                                <>
                                    <div className="flex items-start justify-between gap-3 mb-5">
                                        <div>
                                            <p className={LBL}>Plan</p>
                                            <h3 className="text-2xl font-bold text-white mt-1">{m.packageName}</h3>
                                        </div>
                                        {!isActive && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Renewal needed
                                            </div>
                                        )}
                                        {isActive && daysLeft <= 7 && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Expiring in {daysLeft}d
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Start Date',     value: fmt(m.startDate) },
                                            { label: 'End Date',       value: fmt(m.endDate) },
                                            { label: 'Duration',       value: m.planDuration ? `${m.planDuration} days` : '30 days' },
                                            { label: 'Amount Paid',    value: m.amountPaid ? `₹${m.amountPaid.toLocaleString('en-IN')}` : '—' },
                                            {
                                                label: 'Days Left',
                                                value: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : 'Expired') : '—',
                                                accent: daysLeft !== null && daysLeft <= 0 ? 'text-red-400'
                                                    : daysLeft !== null && daysLeft <= 7 ? 'text-amber-400'
                                                    : 'text-emerald-400'
                                            },
                                            { label: 'Payment Method', value: m.paymentMethod || '—' },
                                        ].map(({ label: l, value, accent }) => (
                                            <div key={l} className="bg-[#1a2233] border border-[#2d3748] rounded-xl p-3.5">
                                                <p className={LBL}>{l}</p>
                                                <p className={`text-sm font-semibold mt-1.5 ${accent || 'text-gray-300'}`}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No active plan</p>
                                    <p className="text-gray-600 text-sm mt-1 mb-4">You can assign a new plan below.</p>
                                </div>
                            )}

                            {/* Admin Quick Renew/Assign Section */}
                            <div className="mt-5 pt-5 border-t border-[#1f2937]">
                                {!showAssignForm ? (
                                    <div className="flex flex-wrap gap-3">
                                        {m && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Renew existing plan "${m.packageName}" for ₹${m.amountPaid}?`)) {
                                                        handleAssignMembership(null, m);
                                                    }
                                                }}
                                                disabled={assigning}
                                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all disabled:opacity-50"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${assigning ? 'animate-spin' : ''}`} />
                                                Renew Existing Plan
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAssignForm(true)}
                                            disabled={assigning}
                                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-300 bg-[#1f2937] border border-[#374151] hover:bg-[#2d3748] rounded-xl transition-all disabled:opacity-50"
                                        >
                                            <Package className="w-3.5 h-3.5" />
                                            Choose Plan
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => handleAssignMembership(e)} className="space-y-4 bg-[#161d2a] p-4 rounded-xl border border-[#2d3748]">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Select & Assign New Plan</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block ${LBL} mb-1.5`}>Select Package</label>
                                                <select
                                                    required
                                                    value={assignPkgId}
                                                    onChange={(e) => setAssignPkgId(e.target.value)}
                                                    className="w-full px-3 py-2 border border-[#2d3748] rounded-xl text-xs text-gray-300 bg-[#111827] outline-none"
                                                >
                                                    <option value="">-- Choose a package --</option>
                                                    {packages.map(p => (
                                                        <option key={p._id} value={p._id}>
                                                            {p.name} ({p.duration}) - ₹{p.price}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`block ${LBL} mb-1.5`}>Payment Method</label>
                                                <select
                                                    value={assignPaymentMethod}
                                                    onChange={(e) => setAssignPaymentMethod(e.target.value)}
                                                    className="w-full px-3 py-2 border border-[#2d3748] rounded-xl text-xs text-gray-300 bg-[#111827] outline-none"
                                                >
                                                    <option value="cash_on_bench">Cash (Bench/Reception)</option>
                                                    <option value="upi">UPI</option>
                                                    <option value="pay_later">Pay Later</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`block ${LBL} mb-1.5`}>Custom Start Date (Optional)</label>
                                                <input
                                                    type="date"
                                                    value={assignStartDate}
                                                    onChange={(e) => setAssignStartDate(e.target.value)}
                                                    className="w-full px-3 py-2 border border-[#2d3748] rounded-xl text-xs text-gray-300 bg-[#111827] outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAssignForm(false);
                                                    setAssignPkgId('');
                                                    setAssignStartDate('');
                                                }}
                                                className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={assigning}
                                                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                                            >
                                                {assigning ? 'Assigning...' : 'Assign Plan'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Plan History */}
                    <div className={CARD}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2937]">
                            <p className={LBL}>Plan History</p>
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-gray-500">
                                    {user.allMemberships?.length || 0} plans · ₹{totalSpent.toLocaleString('en-IN')}
                                </span>
                                <button
                                    onClick={() => setPlanForm({
                                        mode: 'create',
                                        data: {
                                            packageName: '',
                                            planDuration: 30,
                                            amountPaid: 0,
                                            startDate: new Date().toISOString().split('T')[0],
                                            endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                                            status: 'active'
                                        }
                                    })}
                                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-300 bg-purple-900/40 border border-purple-700/60 hover:bg-purple-900/70 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Plan
                                </button>
                            </div>
                        </div>

                        {/* Inline Plan Form for Create / Edit */}
                        {planForm && (
                            <div className="p-4 bg-[#161d2a] border-b border-[#1f2937]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                                        {planForm.mode === 'create' ? '➕ Add New Membership Plan' : '✏️ Edit Membership Plan'}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setPlanForm(null)}
                                        className="text-gray-400 hover:text-gray-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <form onSubmit={handlePlanSave} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className={`block ${LBL} mb-1`}>Package Name *</label>
                                        <input
                                            required
                                            value={planForm.data.packageName}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, packageName: e.target.value } }))}
                                            className="w-full px-3 py-2 text-xs border border-[#2d3748] rounded-xl text-gray-200 bg-[#111827] outline-none focus:border-purple-500"
                                            placeholder="e.g. HARDCORE"
                                            list="profile-pkg-list"
                                        />
                                        <datalist id="profile-pkg-list">
                                            {packages.map(p => <option key={p._id} value={p.name} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className={`block ${LBL} mb-1`}>Duration (days) *</label>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={planForm.data.planDuration}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, planDuration: e.target.value } }))}
                                            className="w-full px-3 py-2 text-xs border border-[#2d3748] rounded-xl text-gray-200 bg-[#111827] outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block ${LBL} mb-1`}>Amount Paid (₹) *</label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            value={planForm.data.amountPaid}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, amountPaid: e.target.value } }))}
                                            className="w-full px-3 py-2 text-xs border border-[#2d3748] rounded-xl text-gray-200 bg-[#111827] outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block ${LBL} mb-1`}>Start Date *</label>
                                        <input
                                            required
                                            type="date"
                                            value={planForm.data.startDate}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, startDate: e.target.value } }))}
                                            className="w-full px-3 py-2 text-xs border border-[#2d3748] rounded-xl text-gray-200 bg-[#111827] outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block ${LBL} mb-1`}>End Date *</label>
                                        <input
                                            required
                                            type="date"
                                            value={planForm.data.endDate}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, endDate: e.target.value } }))}
                                            className="w-full px-3 py-2 text-xs border border-[#2d3748] rounded-xl text-gray-200 bg-[#111827] outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block ${LBL} mb-1`}>Status</label>
                                        <select
                                            value={planForm.data.status}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, status: e.target.value } }))}
                                            className="w-full px-3 py-2 text-xs border border-[#2d3748] rounded-xl text-gray-200 bg-[#111827] outline-none focus:border-purple-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-3 flex gap-2 justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setPlanForm(null)}
                                            className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={planSaving}
                                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                                        >
                                            {planSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            {planSaving ? 'Saving...' : 'Save Plan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {(!user.allMemberships || user.allMemberships.length === 0) ? (
                            <div className="text-center py-12">
                                <Award className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm">No plan history found.</p>
                                <p className="text-xs text-gray-700 mt-1">Click Add Plan above to create a plan record.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#1f2937]">
                                            {['#', 'Plan', 'Duration', 'Start', 'End', 'Amount', 'Status', 'Actions'].map(h => (
                                                <th key={h} className={`px-4 py-3 text-left ${LBL}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {user.allMemberships.map((mem, idx) => {
                                            const dl = getRemainingDays(mem.endDate);
                                            const active = dl !== null && dl > 0;
                                            return (
                                                <tr key={mem._id || idx} className="border-b border-[#1a2233] hover:bg-[#1a2233] transition-colors">
                                                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                                                        {user.allMemberships.length - idx}
                                                        {idx === 0 && (
                                                            <span className="ml-1.5 text-[9px] bg-[#1f2937] text-gray-400 font-semibold px-1.5 py-0.5 rounded border border-[#374151]">
                                                                LATEST
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300 font-medium">{mem.packageName}</td>
                                                    <td className="px-4 py-3 text-gray-600 text-xs">{mem.planDuration ? `${mem.planDuration}d` : '30d'}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(mem.startDate)}</td>
                                                    <td className="px-4 py-3 text-xs">
                                                        <span className={active ? 'text-gray-500' : 'text-red-500'}>{fmt(mem.endDate)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300 font-medium">₹{mem.amountPaid?.toLocaleString('en-IN') || '0'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
                                                            active
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}>
                                                            {active ? `${dl}d left` : 'Expired'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                title="Edit plan"
                                                                onClick={() => setPlanForm({
                                                                    mode: 'edit',
                                                                    data: {
                                                                        _id: mem._id,
                                                                        packageName: mem.packageName || '',
                                                                        planDuration: mem.planDuration || 30,
                                                                        amountPaid: mem.amountPaid || 0,
                                                                        startDate: fmtInput(mem.startDate),
                                                                        endDate: fmtInput(mem.endDate),
                                                                        status: mem.status || 'active'
                                                                    }
                                                                })}
                                                                className="p-1 rounded text-blue-400 hover:bg-blue-500/10 transition-colors"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                title="Delete plan"
                                                                disabled={planDeleting === mem._id}
                                                                onClick={() => handlePlanDelete(mem._id)}
                                                                className="p-1 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                                            >
                                                                {planDeleting === mem._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Attendance */}
                    <div className={CARD}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2937]">
                            <div className="flex items-center gap-2">
                                <p className={LBL}>Attendance Log</p>
                                {/* Live sync indicator */}
                                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                    LIVE
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-600">{presentDays} days present · {attendance.length} total records</span>
                        </div>
                        {attendance.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm">No attendance records found.</p>
                                <p className="text-gray-700 text-xs mt-1">Records appear here instantly when this member scans their thumb.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#1f2937]">
                                            {['Date', 'Status', 'Check-in Time', 'Marked By'].map(h => (
                                                <th key={h} className={`px-4 py-3 text-left ${LBL}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.map((rec) => (
                                            <tr key={rec._id || rec.date} className="border-b border-[#1a2233] hover:bg-[#1a2233] transition-colors">
                                                <td className="px-4 py-3 text-gray-400 font-medium">{fmt(rec.date)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${
                                                        rec.status === 'present'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : rec.status === 'late'
                                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {rec.status === 'present' ? 'Present' : rec.status === 'late' ? 'Late' : 'Absent'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-xs font-mono">
                                                    {rec.checkInTime
                                                        ? new Date(rec.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs capitalize">
                                                    <span className={`${rec.markedBy === 'biometric' ? 'text-purple-400 font-semibold' : 'text-gray-600'}`}>
                                                        {rec.markedBy === 'biometric' ? '🔐 Biometric' : rec.markedBy || '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Edit Modal */}
            {editing && editData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0f1117] border border-[#1f2937] rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
                        <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-[#1f2937]">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Edit className="w-4 h-4 text-gray-500" /> Edit Member Profile
                            </h2>
                            <button onClick={() => setEditing(false)} className="text-gray-600 hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4">
                            {[
                                { label: 'Full Name',     key: 'name',  type: 'text',  required: true },
                                { label: 'Email',         key: 'email', type: 'email', required: true },
                                { label: 'Phone',         key: 'phone', type: 'text' },
                                { label: 'Date of Birth', key: 'dob',   type: 'date' },
                                { label: 'Biometric / Machine User ID (K40 Pro)', key: 'biometricCardId', type: 'text' },
                            ].map(({ label: l, key, type, required }) => (
                                <div key={key}>
                                    <label className={`block ${LBL} mb-1.5`}>{l}</label>
                                    <input type={type} required={required}
                                        className="w-full px-4 py-2.5 border border-[#2d3748] rounded-xl text-sm text-gray-300 bg-[#1a2233] focus:ring-1 focus:ring-white/20 focus:border-white/30 outline-none transition-all"
                                        value={type === 'date' ? fmtInput(editData[key]) : (editData[key] || '')}
                                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })} />
                                </div>
                            ))}

                            {/* Joining Date */}
                            <div className="bg-[#1a2233] border border-[#2d3748] rounded-xl p-4">
                                <label className={`flex items-center gap-1.5 ${LBL} mb-2`}>
                                    <Calendar className="w-3 h-3" /> Joining Date
                                    <span className="ml-auto text-[9px] text-gray-600 font-semibold">Admin only</span>
                                </label>
                                <input type="date"
                                    className="w-full px-4 py-2.5 border border-[#374151] rounded-xl text-sm text-gray-300 bg-[#111827] focus:ring-1 focus:ring-white/20 outline-none"
                                    value={fmtInput(editData.registrationDate || editData.createdAt)}
                                    onChange={(e) => setEditData({ ...editData, registrationDate: e.target.value })} />
                            </div>

                            {/* Plan dates */}
                            {editData.latestMembership && (
                                <div className="bg-[#1a2233] border border-[#2d3748] rounded-xl p-4">
                                    <label className={`flex items-center gap-1.5 ${LBL} mb-3`}>
                                        <Package className="w-3 h-3" /> Plan Start & End Date
                                        <span className="ml-auto text-[9px] text-gray-600 font-semibold">Admin only</span>
                                    </label>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className={`block ${LBL} mb-1.5`}>Start</label>
                                            <input type="date"
                                                className="w-full px-3 py-2 border border-[#374151] rounded-xl text-sm text-gray-300 bg-[#111827] focus:ring-1 focus:ring-white/20 outline-none"
                                                value={fmtInput(editData.latestMembership.startDate)}
                                                onChange={(e) => setEditData({ ...editData, latestMembership: { ...editData.latestMembership, startDate: e.target.value } })} />
                                        </div>
                                        <div className="flex-1">
                                            <label className={`block ${LBL} mb-1.5`}>End</label>
                                            <input type="date"
                                                className="w-full px-3 py-2 border border-[#374151] rounded-xl text-sm text-gray-300 bg-[#111827] focus:ring-1 focus:ring-white/20 outline-none"
                                                value={fmtInput(editData.latestMembership.endDate)}
                                                onChange={(e) => setEditData({ ...editData, latestMembership: { ...editData.latestMembership, endDate: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Batch Time */}
                            <div>
                                <label className={`block ${LBL} mb-1.5`}>Batch Time</label>
                                <select className="w-full px-4 py-2.5 border border-[#2d3748] rounded-xl text-sm text-gray-300 bg-[#1a2233] focus:ring-1 focus:ring-white/20 outline-none"
                                    value={editData.batchTime || ''} onChange={(e) => setEditData({ ...editData, batchTime: e.target.value })}>
                                    <option value="">Not Assigned</option>
                                    <option value="5:30 AM to 7:30 am">5:30 AM to 7:30 am</option>
                                    <option value="7:30 am to 9:30 am">7:30 am to 9:30 am</option>
                                    <option value="5:00PM  to 7:00 pm">5:00 PM to 7:00 pm</option>
                                    <option value="7:00PM  to 9:00 pm">7:00 PM to 9:00 pm</option>
                                </select>
                            </div>

                            {/* Role */}
                            <div>
                                <label className={`block ${LBL} mb-1.5`}>Role</label>
                                <select className="w-full px-4 py-2.5 border border-[#2d3748] rounded-xl text-sm text-gray-300 bg-[#1a2233] focus:ring-1 focus:ring-white/20 outline-none"
                                    value={editData.role || 'user'} onChange={(e) => setEditData({ ...editData, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setEditing(false)}
                                    className="flex-1 py-2.5 text-sm font-medium text-gray-500 bg-[#1a2233] border border-[#2d3748] rounded-xl hover:bg-[#232d42] hover:text-gray-300 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default UserProfile;
