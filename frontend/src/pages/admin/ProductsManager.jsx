import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import {
    Plus, Edit, Trash2, Search, X, Save, Package,
    ChevronDown, Star, StarOff, Eye, EyeOff, Filter,
    Tag, DollarSign, Layers, SlidersHorizontal, RefreshCw
} from 'lucide-react';

// ─── default categories ───────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
    'Protein', 'Multivitamins', 'Pre-Workout', 'Post-Workout',
    'Creatine', 'BCAAs', 'Fat Burners', 'Mass Gainers',
    'Omega-3 & Fish Oil', 'Testosterone Boosters', 'Accessories', 'Other'
];

const EMPTY_FORM = {
    name: '', category: '', description: '', price: '', mrp: '',
    brand: '', weight: '', flavour: '', stock: '', image: '',
    isActive: true, isFeatured: false, tags: ''
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const ProductsManager = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [customCategory, setCustomCategory] = useState('');
    const [showCatInput, setShowCatInput] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [showInactive, setShowInactive] = useState(true);

    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchProducts = useCallback(async (silent = false) => {
        try {
            const { data } = await axios.get('/api/products/admin/all', { headers });
            setProducts(data.products);
            const merged = [...new Set([...DEFAULT_CATEGORIES, ...(data.categories || [])])];
            setCategories(merged);
            if (!silent) setLoading(false);
        } catch { if (!silent) setLoading(false); }
    }, []);

    useEffect(() => {
        fetchProducts();
        const onDbChange = () => { if (!showModal) fetchProducts(true); };
        socket.on('db_changed', onDbChange);
        const interval = setInterval(() => { if (!showModal) fetchProducts(true); }, 5000);
        return () => { clearInterval(interval); socket.off('db_changed', onDbChange); };
    }, [showModal]);

    // ── Filtered list ────────────────────────────────────────────────────────
    const filtered = products
        .filter(p => showInactive ? true : p.isActive)
        .filter(p => filterCat === 'All' ? true : p.category === filterCat)
        .filter(p => !search ? true : (
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand?.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase())
        ))
        .sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (sortBy === 'stock_asc') return a.stock - b.stock;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (p) => {
        setEditProduct(p);
        setForm({ ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '') });
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditProduct(null); setForm(EMPTY_FORM); setCustomCategory(''); setShowCatInput(false); };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price),
                mrp: Number(form.mrp) || 0,
                stock: Number(form.stock) || 0,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                category: showCatInput ? customCategory : form.category,
            };
            if (editProduct) {
                await axios.put(`/api/products/admin/${editProduct._id}`, payload, { headers });
            } else {
                await axios.post('/api/products/admin', payload, { headers });
            }
            closeModal(); fetchProducts(true);
        } catch (err) { alert(err.response?.data?.message || 'Error saving product'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setDeleting(id);
        try { await axios.delete(`/api/products/admin/${id}`, { headers }); fetchProducts(true); }
        catch { alert('Error deleting product'); } finally { setDeleting(null); }
    };

    const toggleActive = async (p) => {
        try {
            await axios.put(`/api/products/admin/${p._id}`, { ...p, isActive: !p.isActive }, { headers });
            fetchProducts(true);
        } catch { alert('Error updating product'); }
    };

    const toggleFeatured = async (p) => {
        try {
            await axios.put(`/api/products/admin/${p._id}`, { ...p, isFeatured: !p.isFeatured }, { headers });
            fetchProducts(true);
        } catch { alert('Error updating product'); }
    };

    const catCounts = products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {});

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-orange-500" /> Products Manager
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">{products.length} products across {categories.filter(c => catCounts[c]).length} categories</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        <RefreshCw className="w-3 h-3" /> Live
                    </span>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-orange-200 hover:-translate-y-0.5">
                        <Plus className="w-4 h-4" /> Add Product
                    </button>
                </div>
            </div>

            {/* Category Quick Filters */}
            <div className="flex gap-2 flex-wrap">
                {['All', ...categories.filter(c => catCounts[c])].map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCat === cat
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600'}`}>
                        {cat} {cat !== 'All' && catCounts[cat] ? `(${catCounts[cat]})` : ''}
                    </button>
                ))}
            </div>

            {/* Search + Sort bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-300 outline-none"
                        placeholder="Search products, brands…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-600 font-semibold"
                    value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="newest">⬇ Newest First</option>
                    <option value="price_asc">💰 Price: Low to High</option>
                    <option value="price_desc">💰 Price: High to Low</option>
                    <option value="name_asc">🔤 Name A-Z</option>
                    <option value="stock_asc">📦 Stock: Low to High</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-500 font-semibold cursor-pointer select-none px-3 py-2 border border-gray-200 rounded-xl">
                    <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-orange-500" />
                    Show Inactive
                </label>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-48 gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
                    <p className="text-gray-400 font-medium text-sm">Loading products…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold">No products found</p>
                    <p className="text-gray-300 text-sm mt-1">Try adjusting filters or add a new product.</p>
                    <button onClick={openAdd} className="mt-4 px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
                        + Add First Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(p => {
                        const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
                        return (
                            <div key={p._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md ${p.isActive ? 'border-gray-100' : 'border-red-100 opacity-70'}`}>
                                {/* Image */}
                                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-200">
                                            <Package className="w-12 h-12" />
                                            <span className="text-xs font-semibold">No Image</span>
                                        </div>
                                    )}
                                    {disc > 0 && (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{disc}% OFF</span>
                                    )}
                                    {p.isFeatured && (
                                        <span className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                            <Star className="w-2.5 h-2.5" /> Featured
                                        </span>
                                    )}
                                    {!p.isActive && (
                                        <span className="absolute bottom-2 left-2 bg-red-100 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full">Inactive</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 flex flex-col flex-1 gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">{p.category}</span>
                                    <h3 className="font-black text-gray-900 text-sm leading-tight">{p.name}</h3>
                                    {p.brand && <p className="text-xs text-gray-400">{p.brand} {p.weight && `· ${p.weight}`}</p>}
                                    {p.flavour && <p className="text-xs text-gray-300">{p.flavour}</p>}

                                    <div className="flex items-baseline gap-2 mt-auto pt-2">
                                        <span className="text-lg font-black text-gray-900">{fmt(p.price)}</span>
                                        {p.mrp > p.price && <span className="text-xs text-gray-300 line-through">{fmt(p.mrp)}</span>}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                            {p.stock === 0 ? '❌ Out of stock' : `📦 ${p.stock} in stock`}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-4 pb-4 flex gap-2">
                                    <button onClick={() => openEdit(p)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                        <Edit className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => toggleFeatured(p)} title={p.isFeatured ? 'Unfeature' : 'Feature'}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${p.isFeatured ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}>
                                        <Star className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => toggleActive(p)} title={p.isActive ? 'Deactivate' : 'Activate'}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${p.isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-red-50 hover:text-red-500' : 'bg-red-100 text-red-500 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                        {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={() => handleDelete(p._id, p.name)} disabled={deleting === p._id}
                                        className="px-2.5 py-1.5 bg-red-50 text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── ADD / EDIT MODAL ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col border border-gray-100" style={{ maxHeight: '92vh' }}>
                        <div className="px-6 py-4 flex justify-between items-center shrink-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl">
                            <h2 className="text-sm font-black text-white flex items-center gap-2">
                                <Package className="w-4 h-4" /> {editProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={closeModal} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label-sm">Product Name *</label>
                                    <input required className="input-field" placeholder="e.g. Whey Gold Standard"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>

                                {/* Category */}
                                <div className="col-span-2">
                                    <label className="label-sm">Category *</label>
                                    <div className="flex gap-2">
                                        {!showCatInput ? (
                                            <select required className="flex-1 input-field"
                                                value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        ) : (
                                            <input className="flex-1 input-field" placeholder="Custom category name"
                                                value={customCategory} onChange={e => setCustomCategory(e.target.value)} />
                                        )}
                                        <button type="button" onClick={() => setShowCatInput(v => !v)}
                                            className="px-3 py-2 border border-orange-200 text-orange-500 rounded-xl text-xs font-bold hover:bg-orange-50 whitespace-nowrap">
                                            {showCatInput ? 'Pick Existing' : '+ New Cat'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="label-sm">Price (₹) *</label>
                                    <input required type="number" min="0" className="input-field" placeholder="999"
                                        value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-sm">MRP / Original Price (₹)</label>
                                    <input type="number" min="0" className="input-field" placeholder="1499"
                                        value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-sm">Brand</label>
                                    <input className="input-field" placeholder="e.g. Optimum Nutrition"
                                        value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-sm">Weight / Size</label>
                                    <input className="input-field" placeholder="e.g. 1kg, 500g, 60 caps"
                                        value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-sm">Flavour</label>
                                    <input className="input-field" placeholder="e.g. Chocolate, Unflavoured"
                                        value={form.flavour} onChange={e => setForm({ ...form, flavour: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-sm">Stock Quantity</label>
                                    <input type="number" min="0" className="input-field" placeholder="50"
                                        value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="label-sm">Description</label>
                                    <textarea className="input-field resize-none" rows={3} placeholder="Short product description…"
                                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="label-sm">Image URL</label>
                                    <input className="input-field" placeholder="https://…"
                                        value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                                    {form.image && <img src={form.image} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-xl border border-gray-200" />}
                                </div>

                                <div className="col-span-2">
                                    <label className="label-sm">Tags (comma separated)</label>
                                    <input className="input-field" placeholder="protein, whey, muscle building"
                                        value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-gray-700">
                                        <input type="checkbox" className="accent-emerald-500 w-4 h-4"
                                            checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                                        Active (Visible to users)
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-gray-700">
                                        <input type="checkbox" className="accent-amber-500 w-4 h-4"
                                            checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                                        ⭐ Featured Product
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-md shadow-orange-200 disabled:opacity-60">
                                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : (editProduct ? 'Save Changes' : 'Add Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .label-sm { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
                .input-field { width: 100%; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 14px; outline: none; background: #f9fafb; transition: all 0.15s; }
                .input-field:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12); background: white; }
            `}</style>
        </div>
    );
};

export default ProductsManager;
