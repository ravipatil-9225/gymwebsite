import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Package, SlidersHorizontal, X, Star, ChevronDown, ShoppingBag } from 'lucide-react';

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const SORT_OPTIONS = [
    { value: 'newest', label: '⬇ Newest First' },
    { value: 'featured', label: '⭐ Featured First' },
    { value: 'price_asc', label: '💰 Price: Low → High' },
    { value: 'price_desc', label: '💰 Price: High → Low' },
    { value: 'name_asc', label: '🔤 Name A → Z' },
];

const ProductCard = ({ p }) => {
    const disc = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/10 group">
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/20">
                        <Package className="w-16 h-16" />
                        <span className="text-xs font-semibold">No Image</span>
                    </div>
                )}
                {disc > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                        {disc}% OFF
                    </div>
                )}
                {p.isFeatured && (
                    <div className="absolute top-3 right-3 bg-amber-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" /> Featured
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1 gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">{p.category}</span>
                <h3 className="font-black text-white text-sm leading-snug">{p.name}</h3>
                {p.brand && (
                    <p className="text-xs text-white/40 font-medium">
                        {p.brand} {p.weight && <span className="text-white/30">· {p.weight}</span>}
                    </p>
                )}
                {p.flavour && <p className="text-xs text-white/30">{p.flavour}</p>}
                {p.description && <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mt-1">{p.description}</p>}

                <div className="flex items-baseline gap-2 mt-auto pt-3 border-t border-white/10">
                    <span className="text-xl font-black text-white">{fmt(p.price)}</span>
                    {p.mrp > p.price && <span className="text-xs text-white/30 line-through">{fmt(p.mrp)}</span>}
                </div>

                {p.stock === 0 && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full w-fit">
                        Out of Stock
                    </span>
                )}
                {p.stock > 0 && p.stock < 10 && (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full w-fit">
                        Only {p.stock} left
                    </span>
                )}
            </div>

            {/* Contact CTA */}
            <div className="px-4 pb-4">
                <a href="tel:+917774850766"
                    className="block w-full text-center py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-black rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/25">
                    📞 Contact to Order
                </a>
            </div>
        </div>
    );
};

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState('featured');
    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const fetchProducts = async () => {
        try {
            const params = { sortBy };
            if (activeCategory !== 'All') params.category = activeCategory;
            if (search) params.search = search;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;

            const { data } = await axios.get('/api/products', { params });
            setProducts(data.products);
            setCategories(['All', ...(data.categories || [])]);
            setLoading(false);
        } catch {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, [activeCategory, sortBy]);
    useEffect(() => {
        const timer = setTimeout(fetchProducts, 400);
        return () => clearTimeout(timer);
    }, [search, minPrice, maxPrice]);

    const resetFilters = () => {
        setSearch(''); setActiveCategory('All'); setSortBy('featured');
        setMinPrice(''); setMaxPrice('');
    };

    const hasFilters = search || activeCategory !== 'All' || sortBy !== 'featured' || minPrice || maxPrice;

    const grouped = {};
    if (activeCategory === 'All') {
        products.forEach(p => {
            if (!grouped[p.category]) grouped[p.category] = [];
            grouped[p.category].push(p);
        });
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">

            {/* Hero */}
            <div className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 blur-[120px] rounded-full" />
                </div>
                <div className="relative max-w-4xl mx-auto">
                    <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full mb-6">
                        <ShoppingBag className="w-3.5 h-3.5" /> Gym Store
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight">
                        Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Supplements</span>
                    </h1>
                    <p className="text-white/50 text-lg max-w-2xl mx-auto">
                        Handpicked supplements to fuel your fitness journey. Contact us to order any product.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

                {/* Search + Filter Bar */}
                <div className="sticky top-24 z-30 bg-[#050505]/80 backdrop-blur-xl pt-2 pb-4">
                    <div className="flex gap-3 items-center flex-wrap">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                                placeholder="Search products, brands…"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none pl-4 pr-9 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
                                value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                        <button onClick={() => setShowFilters(v => !v)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${showFilters ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 text-white/50 hover:border-orange-500/30'}`}>
                            <SlidersHorizontal className="w-4 h-4" /> Filters
                            {hasFilters && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
                        </button>
                        {hasFilters && (
                            <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 font-semibold transition-colors">
                                <X className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                    </div>

                    {/* Price filter */}
                    {showFilters && (
                        <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap gap-4 items-end">
                            <div>
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-wider mb-1">Min Price (₹)</label>
                                <input type="number" className="w-28 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-wider mb-1">Max Price (₹)</label>
                                <input type="number" className="w-28 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    placeholder="99999" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 flex-wrap mb-8">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeCategory === cat
                                ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30'
                                : 'bg-white/5 text-white/50 border-white/10 hover:border-orange-500/40 hover:text-orange-400'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                        <p className="text-white/40 font-medium">Loading products…</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24">
                        <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 font-bold text-lg">No products found</p>
                        <p className="text-white/20 text-sm mt-2">Try adjusting your filters or search term.</p>
                        {hasFilters && (
                            <button onClick={resetFilters} className="mt-4 px-5 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-sm font-bold hover:bg-orange-500/30 transition-colors">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : activeCategory === 'All' ? (
                    /* Grouped by category */
                    <div className="space-y-12">
                        {Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                                <div className="flex items-center gap-4 mb-5">
                                    <div>
                                        <h2 className="text-xl font-black text-white">{cat}</h2>
                                        <p className="text-xs text-white/30 font-semibold">{items.length} product{items.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex-1 h-px bg-white/5" />
                                    {items.length > 4 && (
                                        <button onClick={() => setActiveCategory(cat)}
                                            className="text-xs text-orange-400 font-bold hover:underline whitespace-nowrap">
                                            View all →
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {items.map(p => <ProductCard key={p._id} p={p} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Single category grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map(p => <ProductCard key={p._id} p={p} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
