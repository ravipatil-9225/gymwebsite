import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Link } from 'react-router-dom';
import { Trash2, Edit, X, User, Phone, Mail, Calendar, Package, Clock, CheckCircle, XCircle, Search, History, RefreshCw } from 'lucide-react';

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

const PlanBadge = ({ membership }) => {
    if (!membership) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                No Plan
            </span>
        );
    }
    const days = getRemainingDays(membership.endDate);
    const isActive = days !== null && days > 0;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
            {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isActive ? 'Active' : 'Expired'}
        </span>
    );
};

const DaysRemaining = ({ membership }) => {
    if (!membership) return <span className="text-gray-400 text-xs">—</span>;
    const days = getRemainingDays(membership.endDate);
    if (days === null) return <span className="text-gray-400 text-xs">—</span>;
    if (days <= 0) return <span className="text-red-500 text-xs font-semibold">Expired</span>;
    return (
        <span className={`text-xs font-semibold ${days <= 7 ? 'text-orange-500' : 'text-green-600'}`}>
            {days} day{days !== 1 ? 's' : ''} left
        </span>
    );
};

// ─── main component ───────────────────────────────────────────────────────────
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [addingUser, setAddingUser] = useState(null);
    const [historyUser, setHistoryUser] = useState(null);
    const [search, setSearch] = useState('');

    // ── Renew / Assign Membership ────────────────────────────────────────────
    const [renewalUser, setRenewalUser] = useState(null);
    const [packages, setPackages] = useState([]);
    const [renewPkgId, setRenewPkgId] = useState('');
    const [renewPayMethod, setRenewPayMethod] = useState('cash_on_bench');
    const [renewStartDate, setRenewStartDate] = useState('');
    const [renewing, setRenewing] = useState(false);

    const fetchUsers = async (silent = false) => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(data);
            setFiltered(data);
            if (!silent) setLoading(false);
        } catch (err) {
            console.error('Failed to fetch users', err);
            if (!silent) setLoading(false);
        }
    };

    const fetchPackages = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get('/api/admin/packages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPackages(data);
        } catch (err) { console.error('Failed to fetch packages', err); }
    }, []);

    const handleRenewMembership = async (e) => {
        if (e) e.preventDefault();
        if (!renewalUser) return;
        setRenewing(true);
        const token = localStorage.getItem('adminToken');
        try {
            const payload = renewPkgId
                ? { packageId: renewPkgId, paymentMethod: renewPayMethod, startDate: renewStartDate || undefined }
                : { packageName: renewalUser.latestMembership.packageName, planDuration: renewalUser.latestMembership.planDuration, amountPaid: renewalUser.latestMembership.amountPaid, paymentMethod: renewPayMethod };

            await axios.post(`/api/admin/users/${renewalUser._id}/assign-membership`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Membership updated successfully!');
            setRenewalUser(null);
            setRenewPkgId('');
            setRenewStartDate('');
            setRenewPayMethod('cash_on_bench');
            fetchUsers(true);
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating membership');
        } finally {
            setRenewing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchPackages();
        const onDbChange = () => { if (!editingUser && !addingUser && !renewalUser) fetchUsers(true); };
        socket.on('db_changed', onDbChange);
        const interval = setInterval(() => { if (!editingUser && !addingUser && !renewalUser) fetchUsers(true); }, 5000);
        return () => {
            clearInterval(interval);
            socket.off('db_changed', onDbChange);
        };
    }, [editingUser, addingUser, renewalUser]);

    // Live search
    useEffect(() => {
        if (!search.trim()) { setFiltered(users); return; }
        const q = search.toLowerCase();
        setFiltered(users.filter(u =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.toLowerCase().includes(q) ||
            u.latestMembership?.packageName?.toLowerCase().includes(q)
        ));
    }, [search, users]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/admin/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch {
            alert('Error deleting user');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const { data: updatedUser } = await axios.put(`/api/admin/users/${editingUser._id}`, editingUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // ✅ Optimistic update: merge the server response + the latestMembership changes
            const merged = { ...updatedUser, latestMembership: editingUser.latestMembership, allMemberships: editingUser.allMemberships };
            setUsers(prev => prev.map(u => u._id === editingUser._id ? merged : u));
            setFiltered(prev => prev.map(u => u._id === editingUser._id ? merged : u));
            setEditingUser(null);
        } catch (err) {
            alert('Error updating user');
            console.error(err);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`/api/admin/users`, addingUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddingUser(null);
            fetchUsers();
            alert('User created successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating user');
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
            Loading users...
        </div>
    );

    return (
        <div className="space-y-5">
            <datalist id="batch-times">
                {Array.from(new Set([
                    '5.30am to 9.00am',
                    '5.00pm to 9.00pm',
                    ...users.map(u => u.batchTime).filter(bt => bt && bt !== 'Not Assigned')
                ])).map(time => (
                    <option key={time} value={time} />
                ))}
            </datalist>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{users.length} total users</p>
                </div>
                {/* Actions */}
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, phone, plan…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => setAddingUser({ name: '', email: '', phone: '', dob: '', password: '', role: 'user', batchTime: '', registrationDate: new Date().toISOString().split('T')[0] })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <User className="w-4 h-4" /> Add User
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Users', value: users.length, color: 'blue' },
                    { label: 'Active Plans', value: users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) > 0).length, color: 'green' },
                    { label: 'Expired Plans', value: users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) <= 0).length, color: 'red' },
                    { label: 'No Plan', value: users.filter(u => !u.latestMembership).length, color: 'gray' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3`}>
                        <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
                        <p className={`text-xs text-${color}-600 mt-0.5`}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Name</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Phone</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Email</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />DOB</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Reg. Date</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Batch</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />Plan</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Start Date</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">End Date</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Duration</span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Allow Pending</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Days Left</th>
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((user) => {
                                const m = user.latestMembership;
                                const daysLeft = m ? getRemainingDays(m.endDate) : null;
                                const isActive = daysLeft !== null && daysLeft > 0;
                                const rowBg = m
                                    ? isActive
                                        ? 'hover:bg-green-50/40'
                                        : 'hover:bg-red-50/30'
                                    : 'hover:bg-gray-50';

                                return (
                                    <tr key={user._id} className={`transition-colors ${rowBg}`}>
                                        {/* Name + role */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                    {user.profileImage?.url ? (
                                                        <img src={user.profileImage.url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <Link
                                                        to={`/admin/users/${user._id}`}
                                                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline leading-tight transition-colors"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                    <span className={`block text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit mt-0.5 ${
                                                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>{user.role}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Phone */}
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {user.phone || <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Email */}
                                        <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                                            {user.email}
                                        </td>

                                        {/* DOB */}
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {user.dob ? fmt(user.dob) : <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Registration Date */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {user.registrationDate ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3" />
                                                    {fmt(user.registrationDate)}
                                                </span>
                                            ) : user.createdAt ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                                                    <Calendar className="w-3 h-3" />
                                                    {fmt(user.createdAt)}
                                                </span>
                                            ) : <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Batch Time */}
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-medium">
                                            {user.batchTime && user.batchTime !== 'Not Assigned' ? (
                                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">{user.batchTime}</span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">Not Assigned</span>
                                            )}
                                        </td>

                                        {/* Plan name */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {m
                                                ? <span className="font-medium text-gray-800">{m.packageName}</span>
                                                : <span className="text-gray-300 text-xs">No Plan</span>}
                                        </td>

                                        {/* Start date */}
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                            {m ? fmt(m.startDate) : <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* End date */}
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                                            {m
                                                ? <span className={isActive ? 'text-gray-700' : 'text-red-500 font-medium'}>{fmt(m.endDate)}</span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Duration */}
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                            {m?.planDuration
                                                ? `${m.planDuration} days`
                                                : m ? '30 days' : <span className="text-gray-300">—</span>}
                                        </td>

                                        {/* Allow Pending toggle */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const token = localStorage.getItem('adminToken');
                                                        const { data } = await axios.put(`/api/admin/users/${user._id}/toggle-pending`, {}, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, allowPendingPayment: data.user.allowPendingPayment } : u));
                                                        setFiltered(prev => prev.map(u => u._id === user._id ? { ...u, allowPendingPayment: data.user.allowPendingPayment } : u));
                                                    } catch (err) {
                                                        alert('Error updating pending payment permission');
                                                    }
                                                }}
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${user.allowPendingPayment !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                            >
                                                {user.allowPendingPayment !== false ? '✔ Allow' : '✖ Disable'}
                                            </button>
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <PlanBadge membership={m} />
                                        </td>

                                        {/* Days remaining */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <DaysRemaining membership={m} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => { setRenewalUser(user); setRenewPkgId(''); setRenewStartDate(''); setRenewPayMethod('cash_on_bench'); }}
                                                className="text-emerald-500 hover:text-emerald-700 mr-3 transition-colors"
                                                title="Renew / Assign Membership"
                                            >
                                                <RefreshCw className="w-4 h-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => setHistoryUser(user)}
                                                className="text-purple-500 hover:text-purple-700 mr-3 transition-colors"
                                                title="View plan history"
                                            >
                                                <History className="w-4 h-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="text-blue-500 hover:text-blue-700 mr-3 transition-colors"
                                                title="Edit user"
                                            >
                                                <Edit className="w-4 h-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user._id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="12" className="px-6 py-12 text-center text-gray-400">
                                        {search ? 'No users match your search.' : 'No users found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Renew / Assign Membership Modal ─────────────────────────── */}
            {renewalUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-emerald-500" />
                                    Renew / Assign Plan
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">{renewalUser.name} — {renewalUser.email}</p>
                            </div>
                            <button onClick={() => setRenewalUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRenewMembership} className="overflow-y-auto p-6 space-y-5">
                            {/* Current Plan Banner */}
                            {renewalUser.latestMembership && (
                                <div className={`rounded-xl p-4 border ${
                                    getRemainingDays(renewalUser.latestMembership.endDate) > 0
                                        ? 'bg-green-50 border-green-100'
                                        : 'bg-red-50 border-red-100'
                                }`}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Current Plan</p>
                                    <p className="text-base font-bold text-gray-800">{renewalUser.latestMembership.packageName}</p>
                                    <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                                        <span>Ends: <strong>{fmt(renewalUser.latestMembership.endDate)}</strong></span>
                                        <span className={getRemainingDays(renewalUser.latestMembership.endDate) > 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                                            {getRemainingDays(renewalUser.latestMembership.endDate) > 0
                                                ? `${getRemainingDays(renewalUser.latestMembership.endDate)} days left`
                                                : 'Expired'}
                                        </span>
                                    </div>
                                    {/* Quick renew same plan */}
                                    <button
                                        type="button"
                                        disabled={renewing}
                                        onClick={() => {
                                            if (window.confirm(`Quick-renew "${renewalUser.latestMembership.packageName}" for ₹${renewalUser.latestMembership.amountPaid}?`)) {
                                                handleRenewMembership(null);
                                            }
                                        }}
                                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${renewing ? 'animate-spin' : ''}`} />
                                        Renew Same Plan (₹{renewalUser.latestMembership.amountPaid})
                                    </button>
                                </div>
                            )}

                            <div className="relative flex items-center gap-3">
                                <div className="flex-1 border-t border-gray-200" />
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or choose a new plan</span>
                                <div className="flex-1 border-t border-gray-200" />
                            </div>

                            {/* Package selector */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Package</label>
                                <select
                                    value={renewPkgId}
                                    onChange={(e) => setRenewPkgId(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">-- Select a package --</option>
                                    {packages.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} ({p.duration}) — ₹{p.price}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                                <select
                                    value={renewPayMethod}
                                    onChange={(e) => setRenewPayMethod(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="cash_on_bench">Cash (Bench / Reception)</option>
                                    <option value="upi">UPI</option>
                                    <option value="pay_later">Pay Later</option>
                                </select>
                            </div>

                            {/* Optional start date */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Custom Start Date <span className="text-gray-400 font-normal normal-case">(optional — defaults to today or after current plan)</span>
                                </label>
                                <input
                                    type="date"
                                    value={renewStartDate}
                                    onChange={(e) => setRenewStartDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRenewalUser(null)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={renewing || !renewPkgId}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${renewing ? 'animate-spin' : ''}`} />
                                    {renewing ? 'Assigning...' : 'Assign Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Plan History Modal ────────────────────────────────────── */}
            {historyUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-purple-500" />
                                    Plan History — {historyUser.name}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">{historyUser.email}</p>
                            </div>
                            <button onClick={() => setHistoryUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto p-6">
                            {(!historyUser.allMemberships || historyUser.allMemberships.length === 0) ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p>No plan history found for this user.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Plan Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Duration</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Start Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">End Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Amount Paid</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {historyUser.allMemberships.map((m, idx) => {
                                            const daysLeft = getRemainingDays(m.endDate);
                                            const isActive = daysLeft !== null && daysLeft > 0;
                                            return (
                                                <tr key={m._id} className={`transition-colors ${ idx === 0 ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                                                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                                                        {historyUser.allMemberships.length - idx}
                                                        {idx === 0 && <span className="ml-1 text-[10px] text-purple-500 font-semibold">LATEST</span>}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-gray-800">{m.packageName}</td>
                                                    <td className="px-4 py-3 text-gray-600">{m.planDuration ? `${m.planDuration} days` : '30 days'}</td>
                                                    <td className="px-4 py-3 text-gray-600 text-xs">{fmt(m.startDate)}</td>
                                                    <td className="px-4 py-3 text-xs">
                                                        <span className={isActive ? 'text-gray-700' : 'text-red-500 font-medium'}>{fmt(m.endDate)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 font-medium">₹{m.amountPaid?.toLocaleString('en-IN')}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                                        }`}>
                                                            {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            {isActive ? `${daysLeft}d left` : 'Expired'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer summary */}
                        {historyUser.allMemberships?.length > 0 && (
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 shrink-0 flex items-center justify-between text-xs text-gray-500">
                                <span>{historyUser.allMemberships.length} plan{historyUser.allMemberships.length !== 1 ? 's' : ''} total</span>
                                <span>Total spent: ₹{historyUser.allMemberships.reduce((sum, m) => sum + (m.amountPaid || 0), 0).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Edit User Modal ─────────────────────────────────────────── */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="overflow-y-auto p-6 space-y-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', required: true },
                                { label: 'Email', key: 'email', type: 'email', required: true },
                                { label: 'Phone', key: 'phone', type: 'text', required: false },
                                { label: 'Date of Birth', key: 'dob', type: 'date', required: false },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        required={required}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={type === 'date' ? fmtInput(editingUser[key]) : (editingUser[key] || '')}
                                        onChange={(e) => setEditingUser({ ...editingUser, [key]: e.target.value })}
                                    />
                                </div>
                            ))}

                            {/* Registration Date — Admin editable */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                <label className="block text-sm font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Registration / Joining Date
                                    <span className="ml-auto text-[10px] font-normal text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Admin only</span>
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                                    value={fmtInput(editingUser.registrationDate || editingUser.createdAt)}
                                    onChange={(e) => setEditingUser({ ...editingUser, registrationDate: e.target.value })}
                                />
                                <p className="text-[10px] text-emerald-600 mt-1">This date is shown in the user table as the member's joining date.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Time</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={editingUser.batchTime || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, batchTime: e.target.value })}
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
                                    value={editingUser.role || 'user'}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {editingUser.latestMembership && (() => {
                                const mem = editingUser.latestMembership;
                                const startDate = mem.startDate ? new Date(mem.startDate) : new Date();
                                const endDate   = mem.endDate   ? new Date(mem.endDate)   : new Date();
                                const daysLeft  = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

                                const onStartDateChange = (val) => {
                                    setEditingUser({
                                        ...editingUser,
                                        latestMembership: {
                                            ...mem,
                                            startDate: val
                                        }
                                    });
                                };

                                const onEndDateChange = (val) => {
                                    setEditingUser({
                                        ...editingUser,
                                        latestMembership: {
                                            ...mem,
                                            endDate: val
                                        }
                                    });
                                };

                                return (
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            Active Plan Edits
                                        </h3>

                                        {/* Live preview bar */}
                                        <div className="grid grid-cols-3 gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                                            <div>
                                                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-0.5">Start Date</p>
                                                <p className="text-xs font-bold text-blue-700">{fmt(mem.startDate)}</p>
                                            </div>
                                            <div className="border-x border-blue-100">
                                                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-0.5">End Date</p>
                                                <p className={`text-xs font-bold ${daysLeft > 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(mem.endDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-0.5">Days Left</p>
                                                <p className={`text-xs font-bold ${daysLeft > 7 ? 'text-green-600' : daysLeft > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                                    {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={fmtInput(mem.startDate)}
                                                    onChange={(e) => onStartDateChange(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={fmtInput(mem.endDate)}
                                                    onChange={(e) => onEndDateChange(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-orange-500 italic">Changes are saved instantly on clicking "Save Changes".</p>
                                    </div>
                                );
                            })()}

                            <div className="pt-2 pb-2 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Add User Modal ─────────────────────────────────────────── */}
            {addingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
                            <button onClick={() => setAddingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="overflow-y-auto p-6 space-y-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', required: true },
                                { label: 'Email', key: 'email', type: 'email', required: true },
                                { label: 'Phone', key: 'phone', type: 'text', required: true },
                                { label: 'Date of Birth', key: 'dob', type: 'date', required: true },
                                { label: 'Password', key: 'password', type: 'password', required: true },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        required={required}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={addingUser[key] || ''}
                                        onChange={(e) => setAddingUser({ ...addingUser, [key]: e.target.value })}
                                    />
                                </div>
                            ))}

                            {/* Registration Date for new user */}
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                <label className="block text-sm font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Registration / Joining Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                                    value={addingUser.registrationDate || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setAddingUser({ ...addingUser, registrationDate: e.target.value })}
                                />
                                <p className="text-[10px] text-emerald-600 mt-1">Auto-filled with today's date. Change if the member joined on a different date.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Time</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={addingUser.batchTime || ''}
                                    onChange={(e) => setAddingUser({ ...addingUser, batchTime: e.target.value })}
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
                                    value={addingUser.role || 'user'}
                                    onChange={(e) => setAddingUser({ ...addingUser, role: e.target.value })}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddingUser(null)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
