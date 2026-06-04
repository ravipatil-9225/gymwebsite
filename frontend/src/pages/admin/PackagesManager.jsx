import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import socket from '../../utils/socket';

const CATEGORY_OPTIONS = ['BASIC TRAINING PACKAGES', 'PERSONAL TRAINING', 'STEAM BATH'];
const DURATION_OPTIONS  = ['1 Day', '1 Month', '3 Months', '6 Months', '1 Year', 'Other'];
const DURATION_ORDER    = ['1 Day', '1 Month', '3 Months', '6 Months', '1 Year', 'Other'];

const RESET_LABELS = {
    'BASIC TRAINING PACKAGES': 'Reset Basic Training',
    'PERSONAL TRAINING':       'Reset Personal Training',
    'STEAM BATH':              'Reset Steam Bath',
};

const PackagesManager = () => {
    const [packages, setPackages]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [showModal, setShowModal]     = useState(false);
    const [editingId, setEditingId]     = useState(null);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [resetMenu, setResetMenu]     = useState(false);
    const [formData, setFormData]       = useState({
        name: '', category: 'BASIC TRAINING PACKAGES',
        description: '', price: '', duration: '1 Month',
        features: '', isActive: true,
    });

    /* ── Fetch ── */
    const fetchPackages = async (silent = false) => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get('/api/admin/packages', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPackages(data);
        } catch (err) {
            if (!silent) console.error('Failed to fetch packages', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
        const silentFetch = () => fetchPackages(true);
        socket.on('db_changed', silentFetch);
        return () => socket.off('db_changed', silentFetch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Delete ── */
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this package?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/admin/packages/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Optimistic: remove immediately from state
            setPackages(prev => prev.filter(p => p._id !== id));
        } catch { alert('Error deleting package'); }
    };

    /* ── Create / Update ── */
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token   = localStorage.getItem('adminToken');
            const payload = {
                ...formData,
                features: typeof formData.features === 'string'
                    ? formData.features.split(',').map(f => f.trim()).filter(Boolean)
                    : formData.features,
            };
            if (editingId) {
                const { data: updated } = await axios.put(`/api/admin/packages/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // ✅ Optimistic update: replace changed package in state immediately
                setPackages(prev => prev.map(p => p._id === editingId ? updated : p));
            } else {
                const { data: created } = await axios.post('/api/admin/packages', payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // ✅ Optimistic update: prepend new package immediately
                setPackages(prev => [created, ...prev]);
            }
            closeModal();
        } catch { alert(editingId ? 'Error updating package' : 'Error creating package'); }
    };

    /* ── Reset a category ── */
    const handleResetCategory = async (category) => {
        const msg = `This will DELETE all existing "${category}" plans and restore the official plan list.\n\nContinue?`;
        if (!window.confirm(msg)) return;
        setResetMenu(false);
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.post('/api/admin/packages/reset-category', { category }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert(data.message);
            fetchPackages();
        } catch (err) {
            alert(err?.response?.data?.message || `Error resetting ${category}`);
        }
    };

    /* ── Load defaults (non-destructive) ── */
    const handleLoadDefaults = async () => {
        if (!window.confirm('Add any missing default plans (existing ones are kept). Continue?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.post('/api/admin/packages/seed', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert(data.message);
            fetchPackages();
        } catch { alert('Error loading defaults'); }
    };

    /* ── Modal helpers ── */
    const openEditModal = (pkg) => {
        setFormData({
            name:        pkg.name,
            category:    pkg.category || 'BASIC TRAINING PACKAGES',
            description: pkg.description,
            price:       pkg.price,
            duration:    pkg.duration,
            features:    Array.isArray(pkg.features) ? pkg.features.join(', ') : pkg.features,
            isActive:    pkg.isActive !== undefined ? pkg.isActive : true,
        });
        setEditingId(pkg._id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setFormData({
            name: '', category: activeCategory !== 'ALL' ? activeCategory : 'BASIC TRAINING PACKAGES',
            description: '', price: '', duration: '1 Month', features: '', isActive: true,
        });
        setEditingId(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', category: 'BASIC TRAINING PACKAGES', description: '', price: '', duration: '1 Month', features: '', isActive: true });
    };

    /* ── Derived data ── */
    const filtered = activeCategory === 'ALL'
        ? packages
        : packages.filter(p => p.category === activeCategory);

    const grouped = filtered.reduce((acc, pkg) => {
        const dur = pkg.duration || 'Other';
        if (!acc[dur]) acc[dur] = [];
        acc[dur].push(pkg);
        return acc;
    }, {});

    const categoryCount = (cat) => packages.filter(p => p.category === cat).length;

    if (loading) return <div className="p-8 text-gray-500">Loading packages…</div>;

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Packages Management</h1>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Reset dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setResetMenu(v => !v)}
                            className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-orange-600 transition font-semibold"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset Category
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {resetMenu && (
                            <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                                {CATEGORY_OPTIONS.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleResetCategory(cat)}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2 border-b border-gray-50 last:border-0"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                        {RESET_LABELS[cat]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLoadDefaults}
                        className="bg-gray-700 text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-600 transition"
                    >
                        Load Defaults
                    </button>

                    <button
                        onClick={openCreateModal}
                        className="bg-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 hover:bg-primary-hover transition font-semibold"
                    >
                        <Plus className="w-4 h-4" /> Add Package
                    </button>
                </div>
            </div>

            {/* ── Category Filter Tabs ── */}
            <div className="flex flex-wrap gap-2 items-center">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                {['ALL', ...CATEGORY_OPTIONS].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            activeCategory === cat
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
                        }`}
                    >
                        {cat}
                        <span className="ml-1.5 opacity-70">
                            ({cat === 'ALL' ? packages.length : categoryCount(cat)})
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Plans grouped by duration ── */}
            {DURATION_ORDER.map(dur => {
                const plans = grouped[dur];
                if (!plans || plans.length === 0) return null;
                return (
                    <div key={dur}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{dur}</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-400 text-xs">
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Name</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Category</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Price (₹)</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Features</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {plans.map(pkg => (
                                            <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3 font-semibold text-gray-900">{pkg.name}</td>
                                                <td className="px-5 py-3">
                                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                        {pkg.category || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 font-bold text-gray-800">₹{pkg.price?.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-gray-400 text-xs max-w-[220px] truncate hidden md:table-cell">
                                                    {(pkg.features || []).join(', ')}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {pkg.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                                    <button onClick={() => openEditModal(pkg)} className="text-blue-500 hover:text-blue-700 mr-3" title="Edit">
                                                        <Edit className="w-4 h-4 inline" />
                                                    </button>
                                                    <button onClick={() => handleDelete(pkg._id)} className="text-red-400 hover:text-red-600" title="Delete">
                                                        <Trash2 className="w-4 h-4 inline" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })}

            {filtered.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm mb-3">No packages in this category.</p>
                    <button onClick={openCreateModal} className="text-primary text-sm font-semibold hover:underline">
                        + Add a package
                    </button>
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={e => e.target === e.currentTarget && closeModal()}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-5 text-gray-900">
                            {editingId ? 'Edit Package' : 'Add New Package'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Plan Name *</label>
                                <input
                                    required type="text"
                                    placeholder="e.g. ONLY STRENGTH"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Category *</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white font-semibold text-primary"
                                >
                                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Duration *</label>
                                <select
                                    required
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
                                >
                                    {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Price (₹) *</label>
                                <input
                                    required type="number" min="0"
                                    placeholder="e.g. 3000"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Description *</label>
                                <input
                                    required type="text"
                                    placeholder="Brief description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                                    Features <span className="normal-case text-gray-400">(comma separated)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Gym Access, Weight Training, Diet Plan"
                                    value={formData.features}
                                    onChange={e => setFormData({ ...formData, features: e.target.value })}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                                />
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox" id="isActive"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 accent-primary"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Active (visible on website)</label>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="px-5 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition font-semibold">
                                    {editingId ? 'Update Package' : 'Save Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* close reset menu when clicking outside */}
            {resetMenu && (
                <div className="fixed inset-0 z-10" onClick={() => setResetMenu(false)} />
            )}
        </div>
    );
};

export default PackagesManager;
