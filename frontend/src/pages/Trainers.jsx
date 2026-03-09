import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Award, CalendarClock } from 'lucide-react';

const trainersData = [
    {
        id: 1,
        name: 'Tara Parmar',
        role: 'Founder & Head Coach',
        image: '/owner.jpg', // Utilizing the existing owner image
        bio: 'With over a decade of experience in strength training and body conditioning, Tara leads our gym with a passion for helping people achieve their absolute best.',
        specialties: ['Strength & Conditioning', 'Bodybuilding', 'Nutrition Planning'],
        social: {
            instagram: 'https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==',
        }
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
        }
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const Trainers = () => {
    return (
        <section className="py-24 bg-dark min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16 mt-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-primary tracking-[0.2em] font-sans font-semibold text-sm mb-3 uppercase"
                    >
                        Meet The Team
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        Elite Trainers
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "96px" }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    ></motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto"
                >
                    {trainersData.map((trainer) => (
                        <motion.div
                            key={trainer.id}
                            variants={cardVariants}
                            className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-xl relative"
                        >
                            {/* Accent Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            {/* Image Section */}
                            <div className="h-80 w-full overflow-hidden relative bg-black/40">
                                {trainer.image ? (
                                    <img
                                        src={trainer.image}
                                        alt={trainer.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-dark text-primary/50 text-6xl font-display font-bold">' + trainer.name.charAt(0) + '</div>';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-dark/80 relative">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-30"></div>
                                        <span className="text-primary/50 text-7xl font-display font-bold mb-4 shadow-sm">{trainer.name.charAt(0)}</span>
                                        <span className="text-gray-500 font-sans tracking-widest text-xs uppercase z-10">Image Pending</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-dark-card to-transparent pointer-events-none"></div>
                            </div>

                            {/* Content Section */}
                            <div className="p-8 relative z-10 -mt-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-white font-display text-3xl font-bold tracking-wide mb-1 group-hover:text-primary transition-colors">
                                            {trainer.name}
                                        </h3>
                                        <p className="text-primary font-sans text-sm tracking-wider uppercase font-semibold">
                                            {trainer.role}
                                        </p>
                                    </div>
                                    {trainer.social?.instagram && (
                                        <a
                                            href={trainer.social.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white text-gray-400 transition-all transform hover:-translate-y-1"
                                            title="Instagram"
                                        >
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                </div>

                                <p className="text-gray-400 font-sans leading-relaxed text-sm mb-8">
                                    {trainer.bio}
                                </p>

                                <div>
                                    <h4 className="text-white text-xs tracking-[0.1em] uppercase font-semibold mb-4 flex items-center gap-2">
                                        <Award size={14} className="text-primary" /> Specialist In
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {trainer.specialties.map((spec, i) => (
                                            <span
                                                key={i}
                                                className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-gray-300 font-sans tracking-wide"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-10 pt-6 border-t border-white/5">
                                    <Link
                                        to={`/forms/book-pt?trainer=${encodeURIComponent(trainer.name)}`}
                                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 hover:bg-primary text-white text-sm font-semibold tracking-wider uppercase transition-all duration-300 group/btn"
                                    >
                                        <CalendarClock size={16} className="text-primary group-hover/btn:text-white transition-colors" />
                                        Book Session
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Trainers;
