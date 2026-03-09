import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const SectionLanding = ({ title, subtitle, items }) => {
    const handleHashClick = (e, path) => {
        e.preventDefault();
        const id = path.slice(1);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <section className="py-24 bg-dark relative min-h-[calc(100vh-80px)] overflow-hidden">
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
                        {subtitle}
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        {title}
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
                    className={`grid grid-cols-1 md:grid-cols-2 ${items.length === 4 ? 'lg:grid-cols-2 max-w-4xl' : 'lg:grid-cols-3 max-w-5xl'} gap-6 lg:gap-8 justify-center mx-auto`}
                >
                    {items.map((item, index) => {
                        const Icon = Icons[item.icon] || Icons.Circle;
                        const isHash = item.path.startsWith('#');

                        const CardInner = (
                            <motion.div
                                variants={itemVariants}
                                className="group relative bg-dark-card border border-white/5 hover:border-primary/30 rounded-2xl p-8 transition-all duration-500 overflow-hidden cursor-pointer h-full flex flex-col items-center text-center"
                                style={{ boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                            >
                                {/* Hover Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Icon Container */}
                                <div className="relative z-10 w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 group-hover:rotate-3 group-hover:border-primary/20 transition-all duration-500 shadow-inner">
                                    <Icon size={32} className="text-primary transition-colors duration-500 group-hover:text-white" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex-grow flex flex-col justify-center">
                                    <h3 className="text-white font-display text-2xl font-bold tracking-wide mb-3 group-hover:text-primary transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                    {item.desc && (
                                        <p className="text-gray-400 font-sans leading-relaxed group-hover:text-gray-300 transition-colors duration-300 text-sm">
                                            {item.desc}
                                        </p>
                                    )}
                                </div>

                                {/* Decorative bottom line */}
                                <div className="absolute bottom-0 left-0 w-0 h-1 bg-primary group-hover:w-full transition-all duration-500 ease-out"></div>
                            </motion.div>
                        );

                        return isHash ? (
                            <a
                                key={index}
                                href={item.path}
                                onClick={(e) => handleHashClick(e, item.path)}
                                className="block h-full"
                            >
                                {CardInner}
                            </a>
                        ) : (
                            <Link key={index} to={item.path} className="block h-full">
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
