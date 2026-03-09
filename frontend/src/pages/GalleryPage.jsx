import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Images } from 'lucide-react';

const photos = [
    { id: 1, src: '/gallery/gym1.jpg', alt: 'Tara Fitness Centre – Aerial View', caption: 'Aerial View' },
    { id: 2, src: '/gallery/gym2.jpg', alt: 'Tara Fitness Centre – Active Floor', caption: 'Active Training Floor' },
    { id: 3, src: '/gallery/gym3.jpg', alt: 'Tara Fitness Centre – Equipment', caption: 'State-of-the-Art Equipment' },
    { id: 4, src: '/gallery/gym4.jpg', alt: 'Tara Fitness Centre – Interior', caption: 'Full Gym Interior' },
    { id: 5, src: '/gallery/gym5.jpg', alt: 'Tara Fitness Centre – Building Exterior', caption: 'Our Facility' },
];

const GalleryPage = () => {
    const [lightboxIdx, setLightboxIdx] = useState(null);

    const openLightbox = (idx) => setLightboxIdx(idx);
    const closeLightbox = () => setLightboxIdx(null);
    const prev = () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length);
    const next = () => setLightboxIdx((i) => (i + 1) % photos.length);

    // Keyboard navigation
    useEffect(() => {
        if (lightboxIdx === null) return;
        const handler = (e) => {
            if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIdx]);

    return (
        <section className="py-24 bg-dark min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 mt-8">
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

                {/* Masonry-style Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto"
                >
                    {photos.map((photo, idx) => (
                        <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx, duration: 0.5 }}
                            onClick={() => openLightbox(idx)}
                            className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-white/5 hover:border-primary/40 transition-all duration-500 shadow-xl
                                ${idx === 0 ? 'sm:col-span-2 lg:col-span-2 aspect-[16/8]' : 'aspect-[4/3]'}
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
                                    <p className="text-white font-display text-lg font-semibold tracking-wide translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
                                        {photo.caption}
                                    </p>
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

                <p className="text-center text-gray-500 font-sans text-sm mt-10">{photos.length} photos • Click to open fullscreen</p>
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
                        {/* Close */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>

                        {/* Prev */}
                        <button
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            className="absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft size={24} className="text-white" />
                        </button>

                        {/* Image */}
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
                                <p className="text-gray-500 font-sans text-sm mt-1">{lightboxIdx + 1} / {photos.length}</p>
                            </div>
                        </motion.div>

                        {/* Next */}
                        <button
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            className="absolute right-4 md:right-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                        >
                            <ChevronRight size={24} className="text-white" />
                        </button>

                        {/* Dot indicators */}
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
