import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.09 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 18 } }
};

const SectionLanding = ({ title, subtitle, items }) => {
    const handleHashClick = (e, path) => {
        e.preventDefault();
        const id = path.slice(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section className="py-28 min-h-[calc(100vh-72px)] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-primary/10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-primary/10 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-16 mt-8">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="section-eyebrow mb-4"
                    >
                        {subtitle}
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase tracking-tight leading-none"
                    >
                        {title}
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-px w-24 bg-gradient-to-r from-primary to-transparent mx-auto mt-6 origin-left"
                    />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={
                        items.length === 1
                            ? 'flex justify-center mx-auto w-full'
                            : `grid grid-cols-1 md:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-2 max-w-4xl' : 'lg:grid-cols-3 max-w-5xl'} gap-5 justify-center mx-auto`
                    }
                >
                    {items.map((item, index) => {
                        const Icon = LucideIcons[item.icon] || LucideIcons.Circle;
                        const isHash = item.path.startsWith('#');

                        const CardInner = (
                            <motion.div
                                variants={itemVariants}
                                className="group relative rounded-2xl p-8 cursor-pointer overflow-hidden h-full flex flex-col items-center text-center transition-all duration-400 premium-card"
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
                                    <Icon size={28} className="text-primary transition-colors duration-400" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex-grow flex flex-col justify-center">
                                    <h3 className="text-white font-display text-2xl font-bold tracking-wide mb-3 group-hover:text-white/90 transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                    {item.desc && (
                                        <p className="text-gray-600 font-sans leading-relaxed group-hover:text-gray-500 transition-colors duration-300 text-sm">
                                            {item.desc}
                                        </p>
                                    )}
                                </div>

                                {/* Arrow */}
                                <div className="relative z-10 mt-5 flex items-center gap-1.5 text-primary/40 group-hover:text-primary text-xs font-bold tracking-widest uppercase transition-all duration-300">
                                    Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                </div>

                                {/* Bottom accent */}
                                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-transparent transition-all duration-500 ease-out" />

                                {/* Corner number */}
                                <span className="absolute top-4 right-4 text-white/4 font-display text-3xl font-black select-none">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </motion.div>
                        );

                        return isHash ? (
                            <a
                                key={index}
                                href={item.path}
                                onClick={(e) => handleHashClick(e, item.path)}
                                className={`block h-full${items.length === 1 ? ' w-80' : ''}`}
                            >
                                {CardInner}
                            </a>
                        ) : (
                            <Link key={index} to={item.path} className={`block h-full${items.length === 1 ? ' w-80' : ''}`}>
                                {CardInner}
                            </Link>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default SectionLanding;
