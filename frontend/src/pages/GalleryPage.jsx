import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import socket from '../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Images, Folder, ArrowLeft } from 'lucide-react';

const GalleryPage = () => {
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [allPhotos, setAllPhotos] = useState([]);
    const [persistedFolders, setPersistedFolders] = useState([]);
    const [activeFolder, setActiveFolder] = useState(null);

    const fetchData = async () => {
        try {
            const [galleryRes, foldersRes] = await Promise.all([
                axios.get('/api/public/gallery'),
                axios.get('/api/public/gallery-folders'),
            ]);
            setAllPhotos(galleryRes.data.filter(g => g.isActive).map((g, i) => ({
                id: g._id || i,
                src: g.imageUrl,
                alt: g.title || 'Gym Facility',
                caption: g.title || g.category || 'Gym Facility',
                folder: g.folder || 'General',
            })));
            setPersistedFolders(foldersRes.data);
        } catch(e) { console.error(e); }
    };

    useEffect(() => {
        fetchData();
        socket.on('db_changed', fetchData);
        return () => socket.off('db_changed', fetchData);
    }, []);

    // Merge: persisted folder names + any folder names from images
    const folders = useMemo(() => {
        const fromImages = new Set(allPhotos.map(p => p.folder));
        const fromDB = new Set(persistedFolders.map(f => f.name));
        const merged = new Set([...fromImages, ...fromDB]);
        return ['All', ...Array.from(merged).sort()];
    }, [allPhotos, persistedFolders]);

    const photos = useMemo(() => {
        if (activeFolder === 'All') return allPhotos;
        return allPhotos.filter(p => p.folder === activeFolder);
    }, [allPhotos, activeFolder]);

    const openLightbox = (idx) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);
    const prev = () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length);
    const next = () => setLightboxIdx((i) => (i + 1) % photos.length);

    useEffect(() => {
        if (lightboxIdx === null) return;
        const handler = (e) => {
            if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIdx, photos]);

    return (
        <section className="py-24 bg-dark min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-10 mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 mb-4"
                    >
                        <Images size={20} className="text-primary" />
                        <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-sm uppercase">
                            Our Facility
                        </h2>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        Photo <span className="text-primary font-light">Gallery</span>
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: '96px' }} transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    />
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-gray-400 font-sans mt-6 text-base max-w-xl mx-auto"
                    >
                        Experience our world-class facility through the lens. Click any photo to explore.
                    </motion.p>
                </div>

                {/* View State */}
                {activeFolder === null ? (
                    /* Folders View */
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                    >
                        {folders.map((folder, index) => (
                            <motion.div
                                key={folder}
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 18 } }
                                }}
                                onClick={() => setActiveFolder(folder)}
                                className="group relative rounded-2xl p-8 cursor-pointer overflow-hidden h-full flex flex-col items-center text-center transition-all duration-400 bg-black/40 border border-white/5 hover:border-primary/20"
                                whileHover={{
                                    y: -6,
                                    borderColor: 'rgba(227,74,41,0.25)',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(227,74,41,0.08)',
                                    transition: { duration: 0.3 }
                                }}
                            >
                                {/* Hover gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Icon */}
                                <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary/20 group-hover:bg-primary/10 transition-all duration-400 shadow-inner">
                                    {folder === 'All' ? <Images size={28} className="text-primary transition-colors duration-400" /> : <Folder size={28} className="text-primary transition-colors duration-400" />}
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex-grow flex flex-col justify-center">
                                    <h3 className="text-white font-display text-2xl font-bold tracking-wide mb-3 group-hover:text-white/90 transition-colors duration-300">
                                        {folder === 'All' ? 'All Photos' : folder}
                                    </h3>
                                    <p className="text-gray-500 font-sans leading-relaxed group-hover:text-gray-400 transition-colors duration-300 text-sm">
                                        {folder === 'All' ? allPhotos.length : allPhotos.filter(p => p.folder === folder).length} Photos
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="relative z-10 mt-5 flex items-center gap-1.5 text-primary/40 group-hover:text-primary text-xs font-bold tracking-widest uppercase transition-all duration-300">
                                    Explore <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </div>

                                {/* Bottom accent */}
                                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-transparent transition-all duration-500 ease-out" />

                                {/* Corner number */}
                                <span className="absolute top-4 right-4 text-white/5 font-display text-4xl font-black select-none">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    /* Photos Grid View */
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {/* Header controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveFolder(null)}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-primary hover:text-white text-gray-300 transition-all px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                                    {activeFolder === 'All' ? 'All Photos' : activeFolder}
                                </h2>
                            </div>
                            <div className="text-sm text-gray-400 font-semibold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Grid */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFolder}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto"
                            >
                                {photos.map((photo, idx) => (
                                    <motion.div
                                        key={photo.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.04 * idx, duration: 0.4 }}
                                        onClick={() => openLightbox(idx)}
                                        className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-white/5 hover:border-primary/40 transition-all duration-500 shadow-xl
                                            ${idx === 0 && photos.length > 1 ? 'sm:col-span-2 lg:col-span-2 aspect-[16/8]' : 'aspect-[4/3]'}
                                        `}
                                    >
                                        <img
                                            src={photo.src}
                                            alt={photo.alt}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                        />
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-display text-lg font-semibold tracking-wide translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
                                                        {photo.caption}
                                                    </p>
                                                    {photo.folder && photo.folder !== 'General' && (
                                                        <span className="text-xs text-white/60 flex items-center gap-1 mt-1">
                                                            <Folder className="w-3 h-3" /> {photo.folder}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300">
                                                    <ZoomIn size={18} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Corner accent */}
                                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {/* Empty state */}
                        {photos.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-24 gap-4"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Folder className="w-10 h-10 text-primary/60" />
                                </div>
                                <p className="text-gray-400 text-lg font-semibold">
                                    {activeFolder !== 'All' ? `No photos in "${activeFolder}" yet.` : 'No photos yet.'}
                                </p>
                                <p className="text-gray-600 text-sm">Check back soon — we're adding content!</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIdx !== null && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        <button onClick={closeLightbox} className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                            <X size={20} className="text-white" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                            <ChevronLeft size={24} className="text-white" />
                        </button>

                        <motion.div
                            key={lightboxIdx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-5xl max-h-[80vh] mx-16 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={photos[lightboxIdx].src}
                                alt={photos[lightboxIdx].alt}
                                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                            />
                            <div className="mt-4 text-center">
                                <p className="text-white font-display text-xl tracking-wide">{photos[lightboxIdx].caption}</p>
                                {photos[lightboxIdx].folder && photos[lightboxIdx].folder !== 'General' && (
                                    <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1">
                                        <Folder className="w-3 h-3" /> {photos[lightboxIdx].folder}
                                    </p>
                                )}
                                <p className="text-gray-500 font-sans text-sm mt-1">{lightboxIdx + 1} / {photos.length}</p>
                            </div>
                        </motion.div>

                        <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 md:right-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                            <ChevronRight size={24} className="text-white" />
                        </button>

                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === lightboxIdx ? 'bg-primary w-6' : 'bg-white/30 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default GalleryPage;
