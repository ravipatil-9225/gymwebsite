import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Weight, Clock, Dumbbell, Quote, X, ChevronLeft, ChevronRight } from 'lucide-react';

const TransformationsPage = () => {
    const [transformations, setTransformations] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get('/api/public/transformations');
                setTransformations(data);
            } catch (e) { console.error(e); }
        };
        fetchData();
        socket.on('db_changed', fetchData);
        return () => socket.off('db_changed', fetchData);
    }, []);

    const selected = selectedIdx !== null ? transformations[selectedIdx] : null;

    // Keyboard nav for detail modal
    useEffect(() => {
        if (selectedIdx === null) return;
        const handler = (e) => {
            if (e.key === 'Escape') setSelectedIdx(null);
            if (e.key === 'ArrowLeft') setSelectedIdx(i => (i - 1 + transformations.length) % transformations.length);
            if (e.key === 'ArrowRight') setSelectedIdx(i => (i + 1) % transformations.length);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedIdx, transformations.length]);

    return (
        <section className="py-24 bg-dark min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 mb-4"
                    >
                        <Zap size={20} className="text-primary" />
                        <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-sm uppercase">
                            Real Results
                        </h2>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        Member <span className="text-primary font-light">Transformations</span>
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: '96px' }} transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    />
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-gray-400 font-sans mt-6 text-base max-w-xl mx-auto"
                    >
                        See the incredible journeys of our members. Real people, real results, real transformations.
                    </motion.p>
                </div>

                {/* Transformations Grid */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {transformations.map((t, idx) => (
                        <motion.div
                            key={t._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx, duration: 0.5 }}
                            onClick={() => setSelectedIdx(idx)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04] shadow-xl hover:shadow-2xl hover:shadow-primary/5"
                        >
                            {/* Before / After side by side */}
                            <div className="relative flex h-64 sm:h-72">
                                <div className="w-1/2 overflow-hidden relative">
                                    <img src={t.beforeImage} alt="Before" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <span className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">Before</span>
                                </div>
                                <div className="w-1/2 overflow-hidden relative">
                                    <img src={t.afterImage} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <span className="absolute bottom-3 right-3 bg-primary/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">After</span>
                                </div>
                                {/* Center divider */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#0a0a0a] rounded-full border-2 border-primary/60 flex items-center justify-center z-10 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                    <ArrowRight size={16} className="text-primary" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 space-y-3">
                                <h3 className="text-white font-display text-xl font-bold tracking-wide">{t.memberName}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {t.duration && (
                                        <span className="flex items-center gap-1 text-[11px] bg-white/5 text-white/60 px-3 py-1.5 rounded-lg border border-white/5">
                                            <Clock size={11} className="text-primary" /> {t.duration}
                                        </span>
                                    )}
                                    {t.weightBefore && t.weightAfter && (
                                        <span className="flex items-center gap-1 text-[11px] bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/10">
                                            <Weight size={11} /> {t.weightBefore} → {t.weightAfter}
                                        </span>
                                    )}
                                    {t.programme && (
                                        <span className="flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/10">
                                            <Dumbbell size={11} /> {t.programme}
                                        </span>
                                    )}
                                </div>
                                {t.testimonial && (
                                    <p className="text-white/40 text-sm italic line-clamp-2 leading-relaxed">"{t.testimonial}"</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {transformations.length === 0 && (
                    <div className="text-center py-20">
                        <Zap className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-lg font-display">Transformations coming soon</p>
                        <p className="text-white/20 text-sm mt-2">Check back for inspiring member journeys.</p>
                    </div>
                )}

                <p className="text-center text-gray-600 font-sans text-sm mt-10">{transformations.length} transformations • Click to view details</p>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        key="detail-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedIdx(null)}
                    >
                        {/* Close */}
                        <button onClick={() => setSelectedIdx(null)}
                            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                            <X size={20} className="text-white" />
                        </button>

                        {/* Prev */}
                        {transformations.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(i => (i - 1 + transformations.length) % transformations.length); }}
                                className="absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                                <ChevronLeft size={24} className="text-white" />
                            </button>
                        )}

                        {/* Content */}
                        <motion.div
                            key={selectedIdx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-4xl w-full mx-16 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden">
                                {/* Images */}
                                <div className="flex h-64 sm:h-80 md:h-96">
                                    <div className="w-1/2 overflow-hidden relative">
                                        <img src={selected.beforeImage} alt="Before" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <span className="absolute bottom-4 left-4 bg-white/15 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/10">Before</span>
                                    </div>
                                    <div className="w-1/2 overflow-hidden relative">
                                        <img src={selected.afterImage} alt="After" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <span className="absolute bottom-4 right-4 bg-primary/80 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">After</span>
                                    </div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#0a0a0a] rounded-full border-2 border-primary flex items-center justify-center z-10 shadow-xl shadow-primary/30" style={{ marginTop: '-24px' }}>
                                        <ArrowRight size={20} className="text-primary" />
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 md:p-8 space-y-5">
                                    <div>
                                        <h2 className="text-white font-display text-3xl font-bold tracking-wide">{selected.memberName}</h2>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {selected.duration && (
                                            <span className="flex items-center gap-2 text-sm bg-white/5 text-white/70 px-4 py-2 rounded-xl border border-white/5">
                                                <Clock size={14} className="text-primary" /> {selected.duration}
                                            </span>
                                        )}
                                        {selected.weightBefore && selected.weightAfter && (
                                            <span className="flex items-center gap-2 text-sm bg-green-500/10 text-green-400 px-4 py-2 rounded-xl border border-green-500/10">
                                                <Weight size={14} /> {selected.weightBefore} → {selected.weightAfter}
                                            </span>
                                        )}
                                        {selected.programme && (
                                            <span className="flex items-center gap-2 text-sm bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/10">
                                                <Dumbbell size={14} /> {selected.programme}
                                            </span>
                                        )}
                                    </div>

                                    {selected.testimonial && (
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                                            <Quote size={18} className="text-primary/40 mb-2" />
                                            <p className="text-white/60 text-base italic leading-relaxed">{selected.testimonial}</p>
                                        </div>
                                    )}

                                    <p className="text-white/20 text-xs">{selectedIdx + 1} / {transformations.length}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Next */}
                        {transformations.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); setSelectedIdx(i => (i + 1) % transformations.length); }}
                                className="absolute right-4 md:right-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                                <ChevronRight size={24} className="text-white" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default TransformationsPage;
