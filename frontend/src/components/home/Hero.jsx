import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import axios from 'axios';
import socket from '../../utils/socket';

const stats = [
    { value: '500+', label: 'Members' },
    { value: '10+', label: 'Years' },
    { value: '7', label: 'Services' },
    { value: '2', label: 'Expert Trainers' },
];

const Hero = () => {
    const [cmsData, setCmsData] = useState({
        title: 'Obtain FITNESS Goal',
        subtitle: "Transform your body. Elevate your mind. Kolhapur's most dedicated fitness centre.",
        buttonText: "View Memberships"
    });

    useEffect(() => {
        const fetchHero = async () => {
            try {
                const { data } = await axios.get('/api/public/content/hero');
                if (data && data.data && Object.keys(data.data).length > 0) {
                    setCmsData({
                        title: data.data.title || 'Obtain FITNESS Goal',
                        subtitle: data.data.subtitle || "Transform your body. Elevate your mind. Kolhapur's most dedicated fitness centre.",
                        buttonText: data.data.buttonText || 'View Memberships'
                    });
                }
            } catch (err) {
                console.error("Failed to fetch hero content");
            }
        };

        fetchHero();

        socket.on('db_changed', fetchHero);

        return () => {
            socket.off('db_changed', fetchHero);
        };
    }, []);

    const titleParts = cmsData.title.split(' ');
    const topWord = titleParts[0] || 'Obtain';
    const mainWord = titleParts[1] || 'FITNESS';
    const bottomWord = titleParts.slice(2).join(' ') || 'Goal';

    return (
        <div className="relative w-full min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[#050505]">

            {/* ==== Background layers ==== */}
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none z-0" />

            {/* Hero image with advanced blend */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                    style={{
                        backgroundImage: "url('/hero_bg.png')",
                        opacity: 0.55,
                        mixBlendMode: 'luminosity',
                    }}
                />
                {/* Multi-layer gradient fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050505] to-transparent" />
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#050505] to-transparent" />
                <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#050505] to-transparent" />
            </div>

            {/* Red glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-[100px] pointer-events-none z-0" />
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-orange-800/6 blur-[150px] pointer-events-none z-0" />

            {/* ==== Content ==== */}
            <div className="relative z-10 text-center flex flex-col items-center justify-center w-full px-4 pt-16 pb-24">

                {/* Eyebrow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex items-center gap-4 mb-6"
                >
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary" />
                    <span className="section-eyebrow text-[11px] tracking-[0.4em]">TARA FITNESS CENTRE · KOLHAPUR</span>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary" />
                </motion.div>

                {/* Main headline */}
                <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center leading-[0.82] relative"
                >
                    <h2
                        className="text-white/20 font-display text-[13vw] md:text-[9vw] font-bold uppercase tracking-wide select-none"
                        style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}
                    >
                        {topWord}
                    </h2>

                    <h1
                        className="font-display text-[20vw] md:text-[15vw] font-black uppercase tracking-tight z-10 relative"
                        style={{
                            background: 'linear-gradient(180deg, #ffffff 40%, rgba(255,255,255,0.5) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 40px rgba(227,74,41,0.35))',
                        }}
                    >
                        {mainWord}
                    </h1>

                    <div className="flex items-center justify-end w-full max-w-6xl pr-4 md:pr-20 -mt-4 md:-mt-10">
                        <h2
                            className="text-primary font-display text-[15vw] md:text-[11vw] font-bold uppercase tracking-wide glow-text"
                        >
                            {bottomWord}
                        </h2>
                    </div>
                </motion.div>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-gray-400 font-sans text-sm md:text-base max-w-md mt-6 leading-relaxed tracking-wide"
                >
                    {cmsData.subtitle}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mt-10"
                >
                    <Link
                        to="/packages"
                        className="group flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-[0.15em] uppercase px-8 py-4 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(227,74,41,0.45)] hover:shadow-[0_0_50px_rgba(227,74,41,0.65)] hover:-translate-y-1"
                    >
                        {cmsData.buttonText}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        to="/services"
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm tracking-[0.1em] uppercase px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                    >
                        Explore Services
                    </Link>
                </motion.div>

                {/* Stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                    className="mt-16 w-full max-w-3xl"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center justify-center py-5 px-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
                            >
                                <span className="font-display text-3xl md:text-4xl font-bold stat-glow group-hover:scale-110 transition-transform duration-300">
                                    {stat.value}
                                </span>
                                <span className="text-gray-500 text-xs font-sans tracking-widest uppercase mt-1">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
            >
                <span className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-sans">Scroll</span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                >
                    <ChevronDown size={18} className="text-primary/60" />
                </motion.div>
            </motion.div>

            {/* Decorative corner accent */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20 pointer-events-none z-0" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/20 pointer-events-none z-0" />
        </div>
    );
};

export default Hero;
