import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Link } from 'react-router-dom';
import {
    Trash2, Edit, X, User, Phone, Mail, Calendar, Package, Clock, CheckCircle,
    XCircle, Search, History, RefreshCw, Download, FileText, ChevronDown, Filter, Check, Loader2, Plus, Save
} from 'lucide-react';
import {
    filterUsersByCategoryAndTime,
    getCategoryReportCounts,
    downloadUserReportDOC,
    downloadUserReportPDF,
    CATEGORY_CONFIG,
    TIMEFRAME_CONFIG
} from '../../utils/userReportExport';

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
    // ── Plan History CRUD ──────────────────────────────────────────────────────
    const [planForm, setPlanForm] = useState(null);           // null | { mode:'create'|'edit', data:{} }
    const [planSaving, setPlanSaving] = useState(false);
    const [planDeleting, setPlanDeleting] = useState(null);   // membershipId being deleted
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'alpha-asc' | 'alpha-desc'

    // ── Interactive Category & Timeframe Filters ──────────────────────────────
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'active' | 'expired' | 'no-plan'
    const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'weekly' | 'monthly'
    const [openDownloadMenu, setOpenDownloadMenu] = useState(null); // category id or 'table' or null
    const [downloading, setDownloading] = useState(false);

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
            if (!silent) setLoading(false);
        } catch (err) {
            console.error('Failed to fetch users', err);
            if (!silent) setLoading(false);
        }
    };

    const handleDownloadReport = async (category, timeRange, format) => {
        setDownloading(`${format.toUpperCase()} (${timeRange})`);
        try {
            if (format === 'doc') {
                downloadUserReportDOC({ users, category, timeRange, packages });
            } else if (format === 'pdf') {
                await downloadUserReportPDF({ users, category, timeRange, packages });
            }
        } catch (err) {
            console.error('Download report error:', err);
            alert(`Failed to download ${format.toUpperCase()} report: ${err.message || 'Unknown error'}`);
        } finally {
            setDownloading(false);
            setOpenDownloadMenu(null);
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

    // ── Plan History CRUD Handlers ─────────────────────────────────────────────

    /** Save (create or update) a plan record from the form modal */
    const handlePlanSave = async (e) => {
        e.preventDefault();
        if (!planForm || !historyUser) return;
        setPlanSaving(true);
        const token = localStorage.getItem('adminToken');
        try {
            const { mode, data } = planForm;
            if (mode === 'create') {
                await axios.post(
                    `/api/admin/users/${historyUser._id}/memberships`,
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
            const { data: updatedUsers } = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(updatedUsers);
            // Refresh historyUser in-place
            const fresh = updatedUsers.find(u => u._id === historyUser._id);
            if (fresh) setHistoryUser(fresh);
            setPlanForm(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving plan');
        } finally {
            setPlanSaving(false);
        }
    };

    /** Delete a plan record after confirmation */
    const handlePlanDelete = async (membershipId) => {
        if (!window.confirm('Are you sure you want to delete this plan record? This cannot be undone.')) return;
        setPlanDeleting(membershipId);
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`/api/admin/memberships/${membershipId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { data: updatedUsers } = await axios.get('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(updatedUsers);
            const fresh = updatedUsers.find(u => u._id === historyUser._id);
            if (fresh) setHistoryUser(fresh);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting plan');
        } finally {
            setPlanDeleting(null);
        }
    };

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

    // Live search, category, timeframe, and sorting
    useEffect(() => {
        // 1. Filter by Category & Timeframe
        let result = filterUsersByCategoryAndTime(users, categoryFilter, timeFilter);

        // 2. Filter by live search query
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.phone?.toLowerCase().includes(q) ||
                u.biometricCardId?.toLowerCase().includes(q) ||
                u.latestMembership?.packageName?.toLowerCase().includes(q)
            );
        }

        // 3. Apply sorting
        if (sortBy === 'alpha-asc') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'alpha-desc') {
            result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        } else if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        setFiltered(result);
    }, [search, users, sortBy, categoryFilter, timeFilter]);

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
            const msg = err.response?.data?.message || 'Error updating user';
            alert(msg);
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
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-sm text-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="text-xs font-medium text-gray-400">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="focus:outline-none bg-transparent cursor-pointer font-semibold text-gray-700 text-xs pr-1"
                        >
                            <option value="newest">Newest Joined</option>
                            <option value="alpha-asc">Name (A to Z)</option>
                            <option value="alpha-desc">Name (Z to A)</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setAddingUser({ name: '', email: '', phone: '', dob: '', password: '', role: 'user', batchTime: '', biometricCardId: '', registrationDate: new Date().toISOString().split('T')[0] })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <User className="w-4 h-4" /> Add User
                    </button>
                </div>
            </div>

            {/* Background overlay for open export dropdowns */}
            {openDownloadMenu && (
                <div
                    className="fixed inset-0 z-40 bg-black/10 transition-opacity"
                    onClick={() => setOpenDownloadMenu(null)}
                />
            )}

            {/* Downloading feedback toast */}
            {downloading && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
                    <div>
                        <p className="text-xs font-bold">Generating {downloading} Report...</p>
                        <p className="text-[10px] text-gray-400">Formatting real-time member records</p>
                    </div>
                </div>
            )}

            {/* Stats bar with Interactive Filters & Separately Downloadable Reports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        id: 'all',
                        label: 'Total Users',
                        value: users.length,
                        color: 'blue',
                        bg: 'bg-blue-50/80',
                        border: 'border-blue-100',
                        text: 'text-blue-700',
                        subtext: 'text-blue-600',
                        activeStyle: 'ring-2 ring-blue-500 border-blue-400 bg-blue-100/70 shadow-md',
                        counts: getCategoryReportCounts(users, 'all')
                    },
                    {
                        id: 'active',
                        label: 'Active Plans',
                        value: users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) > 0).length,
                        color: 'green',
                        bg: 'bg-green-50/80',
                        border: 'border-green-100',
                        text: 'text-green-700',
                        subtext: 'text-green-600',
                        activeStyle: 'ring-2 ring-green-500 border-green-400 bg-green-100/70 shadow-md',
                        counts: getCategoryReportCounts(users, 'active')
                    },
                    {
                        id: 'expired',
                        label: 'Expired Plans',
                        value: users.filter(u => u.latestMembership && getRemainingDays(u.latestMembership.endDate) <= 0).length,
                        color: 'red',
                        bg: 'bg-red-50/80',
                        border: 'border-red-100',
                        text: 'text-red-700',
                        subtext: 'text-red-600',
                        activeStyle: 'ring-2 ring-red-500 border-red-400 bg-red-100/70 shadow-md',
                        counts: getCategoryReportCounts(users, 'expired')
                    },
                    {
                        id: 'no-plan',
                        label: 'No Plan',
                        value: users.filter(u => !u.latestMembership).length,
                        color: 'gray',
                        bg: 'bg-gray-50/90',
                        border: 'border-gray-200',
                        text: 'text-gray-700',
                        subtext: 'text-gray-600',
                        activeStyle: 'ring-2 ring-gray-600 border-gray-400 bg-gray-200/80 shadow-md',
                        counts: getCategoryReportCounts(users, 'no-plan')
                    },
                ].map((card) => {
                    const isSelected = categoryFilter === card.id;

                    return (
                        <div
                            key={card.id}
                            onClick={() => {
                                if (categoryFilter === card.id && card.id !== 'all') {
                                    setCategoryFilter('all');
                                } else {
                                    setCategoryFilter(card.id);
                                }
                            }}
                            className={`relative rounded-xl p-3.5 transition-all cursor-pointer border ${card.bg} ${card.border} ${
                                isSelected ? card.activeStyle : 'hover:shadow-md hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className={`text-2xl sm:text-3xl font-extrabold ${card.text}`}>{card.value}</p>
                                    <p className={`text-xs font-semibold ${card.subtext} mt-0.5 flex items-center gap-1.5`}>
                                        {card.label}
                                        {isSelected && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-white text-gray-800 rounded-full shadow-xs border border-gray-200">
                                                <Check className="w-2.5 h-2.5 text-blue-600" /> Active Filter
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Download Popover Trigger */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDownloadMenu(openDownloadMenu === card.id ? null : card.id);
                                        }}
                                        title={`Download ${card.label} details in PDF or DOC`}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 hover:bg-white text-gray-700 border border-gray-200 shadow-xs hover:shadow transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5 text-gray-600" />
                                        <span className="text-[11px]">Download</span>
                                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openDownloadMenu === card.id ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Download Menu */}
                                    {openDownloadMenu === card.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-3.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                                        >
                                            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{card.label} Reports</p>
                                                    <p className="text-[10px] text-gray-500">Download formatted table (.pdf / .doc)</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenDownloadMenu(null)}
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {/* Weekly */}
                                                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-semibold text-gray-800">
                                                            📅 Weekly Details
                                                        </span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                            {card.counts.weekly} records
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={downloading}
                                                            onClick={() => handleDownloadReport(card.id, 'weekly', 'pdf')}
                                                            className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                                        >
                                                            <FileText className="w-3 h-3" /> PDF
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={downloading}
                                                            onClick={() => handleDownloadReport(card.id, 'weekly', 'doc')}
                                                            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                                        >
                                                            <FileText className="w-3 h-3" /> DOC
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Monthly */}
                                                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-semibold text-gray-800">
                                                            📆 Monthly Details
                                                        </span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                            {card.counts.monthly} records
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={downloading}
                                                            onClick={() => handleDownloadReport(card.id, 'monthly', 'pdf')}
                                                            className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                                        >
                                                            <FileText className="w-3 h-3" /> PDF
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={downloading}
                                                            onClick={() => handleDownloadReport(card.id, 'monthly', 'doc')}
                                                            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                                        >
                                                            <FileText className="w-3 h-3" /> DOC
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* All Records */}
                                                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-semibold text-gray-800">
                                                            📋 All Records
                                                        </span>
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                                            {card.counts.all} records
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={downloading}
                                                            onClick={() => handleDownloadReport(card.id, 'all', 'pdf')}
                                                            className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                                        >
                                                            <FileText className="w-3 h-3" /> PDF
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={downloading}
                                                            onClick={() => handleDownloadReport(card.id, 'all', 'doc')}
                                                            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                                        >
                                                            <FileText className="w-3 h-3" /> DOC
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Status Bar with Timeframe Toggle & Quick Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                {/* Active filter pill & reset */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500">Filter View:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Filter className="w-3 h-3" />
                        {CATEGORY_CONFIG[categoryFilter]?.label || 'Total Users'}
                        {timeFilter !== 'all' && (
                            <span className="text-blue-500 font-normal">
                                • {TIMEFRAME_CONFIG[timeFilter]?.label}
                            </span>
                        )}
                        <span className="ml-1 px-1.5 py-0.2 bg-blue-200/60 rounded text-[10px]">
                            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
                        </span>
                    </span>

                    {(categoryFilter !== 'all' || timeFilter !== 'all' || search.trim()) && (
                        <button
                            type="button"
                            onClick={() => {
                                setCategoryFilter('all');
                                setTimeFilter('all');
                                setSearch('');
                            }}
                            className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                            <X className="w-3 h-3" /> Clear Filters
                        </button>
                    )}
                </div>

                {/* Timeframe switch tabs & Table Export Button */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Timeframe selector tabs */}
                    <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200 text-xs">
                        {[
                            { id: 'all', label: 'All Time' },
                            { id: 'weekly', label: 'Weekly (7d)' },
                            { id: 'monthly', label: 'Monthly (30d)' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setTimeFilter(tab.id)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                    timeFilter === tab.id
                                        ? 'bg-white text-gray-900 font-bold shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Export for Current View */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setOpenDownloadMenu(openDownloadMenu === 'table' ? null : 'table')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Details</span>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>

                        {openDownloadMenu === 'table' && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-3.5 z-50 text-left animate-in fade-in zoom-in-95"
                            >
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">
                                            Export {CATEGORY_CONFIG[categoryFilter]?.label}
                                        </p>
                                        <p className="text-[10px] text-gray-500">Download formatted table (.pdf / .doc)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setOpenDownloadMenu(null)}
                                        className="text-gray-400 hover:text-gray-600 p-0.5"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">📅 Weekly Details (Last 7 Days)</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                type="button"
                                                disabled={downloading}
                                                onClick={() => handleDownloadReport(categoryFilter, 'weekly', 'pdf')}
                                                className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                            >
                                                <FileText className="w-3 h-3" /> PDF
                                            </button>
                                            <button
                                                type="button"
                                                disabled={downloading}
                                                onClick={() => handleDownloadReport(categoryFilter, 'weekly', 'doc')}
                                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                            >
                                                <FileText className="w-3 h-3" /> DOC
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">📆 Monthly Details (Last 30 Days)</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                type="button"
                                                disabled={downloading}
                                                onClick={() => handleDownloadReport(categoryFilter, 'monthly', 'pdf')}
                                                className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                            >
                                                <FileText className="w-3 h-3" /> PDF
                                            </button>
                                            <button
                                                type="button"
                                                disabled={downloading}
                                                onClick={() => handleDownloadReport(categoryFilter, 'monthly', 'doc')}
                                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                            >
                                                <FileText className="w-3 h-3" /> DOC
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">📋 All Records ({filtered.length})</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                type="button"
                                                disabled={downloading}
                                                onClick={() => handleDownloadReport(categoryFilter, 'all', 'pdf')}
                                                className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                            >
                                                <FileText className="w-3 h-3" /> PDF
                                            </button>
                                            <button
                                                type="button"
                                                disabled={downloading}
                                                onClick={() => handleDownloadReport(categoryFilter, 'all', 'doc')}
                                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                                            >
                                                <FileText className="w-3 h-3" /> DOC
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
                                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">Bio ID</th>
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

                                        {/* Bio ID */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {user.biometricCardId ? (
                                                <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-md text-xs font-mono font-bold">
                                                    #{user.biometricCardId}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">—</span>
                                            )}
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
                                            {m ? (
                                                <div>
                                                    <span className="font-medium text-gray-800">{m.packageName}</span>
                                                    {m.amountPaid != null && (
                                                        <span className="block text-[11px] font-bold text-emerald-600">
                                                            ₹{Number(m.amountPaid).toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs">No Plan</span>
                                            )}
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
                                                    } catch {
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
                                    <td colSpan="15" className="px-6 py-12 text-center text-gray-400">
                                        <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="font-semibold text-gray-600">No users match the selected filters</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Category: <strong>{CATEGORY_CONFIG[categoryFilter]?.label}</strong> • Timeframe: <strong>{TIMEFRAME_CONFIG[timeFilter]?.label}</strong>
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => { setCategoryFilter('all'); setTimeFilter('all'); setSearch(''); }}
                                            className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                                        >
                                            Reset All Filters
                                        </button>
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

            {/* ── Plan History Modal ────────────────────────────────────────────── */}
            {historyUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-purple-500" />
                                    Plan History — {historyUser.name}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">{historyUser.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Add Plan button */}
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
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Plan
                                </button>
                                <button onClick={() => { setHistoryUser(null); setPlanForm(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Plan Form (inline — shown when creating or editing) */}
                        {planForm && (
                            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 shrink-0">
                                <h3 className="text-sm font-bold text-purple-800 mb-3">
                                    {planForm.mode === 'create' ? '➕ Add New Plan' : '✏️ Edit Plan'}
                                </h3>
                                <form onSubmit={handlePlanSave} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Package Name *</label>
                                        <input
                                            required
                                            value={planForm.data.packageName}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, packageName: e.target.value } }))}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                            placeholder="e.g. HARDCORE"
                                            list="pkg-names-list"
                                        />
                                        <datalist id="pkg-names-list">
                                            {packages.map(p => <option key={p._id} value={p.name} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Duration (days) *</label>
                                        <input
                                            required type="number" min="1"
                                            value={planForm.data.planDuration}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, planDuration: e.target.value } }))}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Amount Paid (₹) *</label>
                                        <input
                                            required type="number" min="0"
                                            value={planForm.data.amountPaid}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, amountPaid: e.target.value } }))}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Start Date *</label>
                                        <input
                                            required type="date"
                                            value={planForm.data.startDate}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, startDate: e.target.value } }))}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">End Date *</label>
                                        <input
                                            required type="date"
                                            value={planForm.data.endDate}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, endDate: e.target.value } }))}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Status</label>
                                        <select
                                            value={planForm.data.status}
                                            onChange={e => setPlanForm(f => ({ ...f, data: { ...f.data, status: e.target.value } }))}
                                            className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none bg-white"
                                        >
                                            <option value="active">Active</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 sm:col-span-3 flex gap-2 justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPlanForm(null)}
                                            className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={planSaving}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-lg transition-colors"
                                        >
                                            {planSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            {planSaving ? 'Saving…' : 'Save Plan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Body – plan table */}
                        <div className="overflow-y-auto p-6">
                            {(!historyUser.allMemberships || historyUser.allMemberships.length === 0) ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p>No plan history found for this user.</p>
                                    <p className="text-xs mt-1">Click <strong>Add Plan</strong> to create the first record.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Plan Name</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Duration</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Start Date</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">End Date</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Amount Paid</th>
                                            <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {historyUser.allMemberships.map((m, idx) => {
                                            const daysLeft = getRemainingDays(m.endDate);
                                            const isActive = daysLeft !== null && daysLeft > 0;
                                            const isDeleting = planDeleting === m._id;
                                            return (
                                                <tr key={m._id} className={`transition-colors ${idx === 0 ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                                                    <td className="px-3 py-3 text-gray-400 text-xs font-mono">
                                                        {historyUser.allMemberships.length - idx}
                                                        {idx === 0 && <span className="ml-1 text-[10px] text-purple-500 font-semibold">LATEST</span>}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-gray-800">{m.packageName}</td>
                                                    <td className="px-3 py-3 text-gray-600">{m.planDuration ? `${m.planDuration} days` : '30 days'}</td>
                                                    <td className="px-3 py-3 text-gray-600 text-xs">{fmt(m.startDate)}</td>
                                                    <td className="px-3 py-3 text-xs">
                                                        <span className={isActive ? 'text-gray-700' : 'text-red-500 font-medium'}>{fmt(m.endDate)}</span>
                                                    </td>
                                                    <td className="px-3 py-3 text-gray-700 font-medium">₹{(m.amountPaid || 0).toLocaleString('en-IN')}</td>
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                                        }`}>
                                                            {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            {isActive ? `${daysLeft}d left` : 'Expired'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Edit button */}
                                                            <button
                                                                title="Edit this plan"
                                                                onClick={() => setPlanForm({
                                                                    mode: 'edit',
                                                                    data: {
                                                                        _id: m._id,
                                                                        packageName: m.packageName || '',
                                                                        planDuration: m.planDuration || 30,
                                                                        amountPaid: m.amountPaid || 0,
                                                                        startDate: fmtInput(m.startDate),
                                                                        endDate: fmtInput(m.endDate),
                                                                        status: m.status || 'active'
                                                                    }
                                                                })}
                                                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            {/* Delete button */}
                                                            <button
                                                                title="Delete this plan"
                                                                disabled={isDeleting}
                                                                onClick={() => handlePlanDelete(m._id)}
                                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                                            >
                                                                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
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
                                { label: 'Biometric / Machine User ID (K40 Pro)', key: 'biometricCardId', type: 'text', required: false },
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
                                { label: 'Biometric / Machine User ID (K40 Pro)', key: 'biometricCardId', type: 'text', required: false },
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
