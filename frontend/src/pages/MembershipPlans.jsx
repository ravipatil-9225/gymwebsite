import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import socket from '../utils/socket';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const MembershipPlans = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async (isSilent = false) => {
            try {
                const { data } = await axios.get('/api/public/packages');
                // Extract unique categories from active packages
                const uniqueCategories = [...new Set(data.filter(p => p.isActive).map(p => p.category || 'OTHER PACKAGES'))];
                
                // Define the desired sorting sequence
                const predefinedOrder = ['BASIC TRAINING PACKAGES', 'PERSONAL TRAINING', 'STEAM BATH'];
                
                uniqueCategories.sort((a, b) => {
                    const indexA = predefinedOrder.indexOf(a);
                    const indexB = predefinedOrder.indexOf(b);
                    
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.localeCompare(b);
                });

                setCategories(uniqueCategories);
            } catch (err) {
                console.error(err);
            } finally {
                if (!isSilent) setLoading(false);
            }
        };

        fetchCategories();
        
        const silentFetch = () => fetchCategories(true);
        socket.on('db_changed', silentFetch);
        return () => socket.off('db_changed', silentFetch);
    }, []);

    return (
        <section className="py-24 bg-dark min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 mt-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-primary tracking-[0.2em] font-sans font-semibold text-sm mb-3 uppercase"
                    >
                        Directory
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        Membership <span className="text-primary font-light">Categories</span>
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: '96px' }} transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    />
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-gray-400 mt-6 max-w-xl mx-auto font-sans text-base"
                    >
                        Select a category to view all corresponding training plans and subscriptions.
                    </motion.p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : categories.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No categories found.</div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                    >
                        {categories.map((categoryName, index) => (
                            <motion.div key={index} variants={itemVariants} className="h-full">
                                <Link
                                    to={`/packages/plans/${encodeURIComponent(categoryName)}`}
                                    className="relative bg-dark-card border border-white/5 rounded-2xl p-8 transition-all duration-500 group overflow-hidden shadow-xl flex flex-col h-full hover:border-primary/50"
                                >
                                    {/* Hover gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10 flex flex-col items-center text-center h-full">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner group-hover:border-primary/30 group-hover:bg-primary/10 text-gray-400 group-hover:text-primary">
                                            <Package size={32} />
                                        </div>

                                        <h3 className="text-white font-display text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                                            {categoryName}
                                        </h3>

                                        <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-white transition-colors tracking-wider uppercase">
                                            View Plans <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default MembershipPlans;
