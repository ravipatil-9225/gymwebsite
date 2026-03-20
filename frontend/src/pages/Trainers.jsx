import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Award, CalendarClock, ArrowRight } from 'lucide-react';

const trainersData = [
    {
        id: 1,
        name: 'Tara Parmar',
        role: 'Founder & Head Coach',
        image: '/owner.jpg',
        bio: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.',
        specialties: ['Strength & Conditioning', 'Bodybuilding', 'Nutrition Planning'],
        social: {
            instagram: 'https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==',
        },
        accentColor: '#E34A29',
        accentGlow: 'rgba(227,74,41,0.2)',
    },
    {
        id: 2,
        name: 'Atharva Chavan',
        role: 'Elite Personal Trainer',
        image: '/atharva.jpg',
        bio: 'Atharva specializes in high-intensity interval training, functional movement, and mobility. His dynamic approach keeps workouts challenging and highly effective.',
        specialties: ['HIIT', 'Functional Training', 'Mobility & Flexibility'],
        social: {
            instagram: 'https://www.instagram.com/_atharvachavan_?igsh=eW5oazR1ajBudzEy',
        },
        accentColor: '#4299e1',
        accentGlow: 'rgba(66,153,225,0.2)',
    }
];

const Trainers = () => {
    return (
        <section className="py-28 min-h-[calc(100vh-72px)] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/10 pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-20 mt-8">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="section-eyebrow mb-4"
                    >
                        Meet The Team
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-5xl md:text-7xl font-display font-black uppercase tracking-tight leading-none"
                    >
                        Elite <span className="text-gradient">Trainers</span>
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-px w-24 bg-gradient-to-r from-primary to-transparent mx-auto mt-6 origin-left"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-500 font-sans mt-5 text-sm max-w-md mx-auto"
                    >
                        Our certified trainers bring years of expertise and genuine passion to every session.
                    </motion.p>
                </div>

                {/* Trainer Cards */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
                >
                    {trainersData.map((trainer) => (
                        <motion.div
                            key={trainer.id}
                            variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } } }}
                            className="group relative rounded-3xl overflow-hidden transition-all duration-500"
                            style={{
                                background: 'linear-gradient(145deg, rgba(18,18,18,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}
                            whileHover={{
                                y: -6,
                                boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${trainer.accentGlow}`,
                                borderColor: `${trainer.accentColor}30`,
                                transition: { duration: 0.4 }
                            }}
                        >
                            {/* Gradient overlay on hover */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                                style={{ background: `radial-gradient(circle at 50% 0%, ${trainer.accentGlow} 0%, transparent 60%)` }}
                            />

                            {/* Image Section */}
                            <div className="h-80 w-full overflow-hidden relative">
                                {trainer.image ? (
                                    <img
                                        src={trainer.image}
                                        alt={trainer.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-[80px] font-display font-black" style="color: ${trainer.accentColor}20; background: ${trainer.accentColor}08">${trainer.name.charAt(0)}</div>`;
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: `${trainer.accentColor}08` }}>
                                        <span className="font-display font-black text-8xl" style={{ color: `${trainer.accentColor}25` }}>
                                            {trainer.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                {/* Bottom fade */}
                                <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
                                {/* Accent top bar */}
                                <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, ${trainer.accentColor}, transparent)` }} />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-8 -mt-16">
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <h3 className="text-white font-display text-3xl font-bold tracking-wide mb-1 group-hover:text-white/90 transition-colors">
                                            {trainer.name}
                                        </h3>
                                        <p className="font-sans text-xs tracking-[0.2em] uppercase font-bold" style={{ color: trainer.accentColor }}>
                                            {trainer.role}
                                        </p>
                                    </div>
                                    {trainer.social?.instagram && (
                                        <a
                                            href={trainer.social.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:-translate-y-1 cursor-pointer"
                                            title="Instagram"
                                        >
                                            <Instagram size={17} />
                                        </a>
                                    )}
                                </div>

                                <p className="text-gray-500 font-sans text-sm leading-relaxed mb-7 group-hover:text-gray-400 transition-colors">
                                    {trainer.bio}
                                </p>

                                {/* Specialties */}
                                <div className="mb-8">
                                    <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-bold mb-3 flex items-center gap-2">
                                        <Award size={12} style={{ color: trainer.accentColor }} /> Specialist In
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {trainer.specialties.map((spec, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1.5 rounded-lg text-xs font-sans font-semibold tracking-wide"
                                                style={{
                                                    background: `${trainer.accentColor}12`,
                                                    border: `1px solid ${trainer.accentColor}25`,
                                                    color: trainer.accentColor,
                                                }}
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Book CTA */}
                                <Link
                                    to={`/forms/book-pt?trainer=${encodeURIComponent(trainer.name)}`}
                                    className="group/btn flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-300 relative overflow-hidden"
                                    style={{
                                        border: `1px solid ${trainer.accentColor}30`,
                                        background: `${trainer.accentColor}08`,
                                        color: trainer.accentColor,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = trainer.accentColor;
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.boxShadow = `0 0 30px ${trainer.accentGlow}`;
                                        e.currentTarget.style.borderColor = trainer.accentColor;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = `${trainer.accentColor}08`;
                                        e.currentTarget.style.color = trainer.accentColor;
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = `${trainer.accentColor}30`;
                                    }}
                                >
                                    <CalendarClock size={15} />
                                    Book a Session
                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Trainers;
