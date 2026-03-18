import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const OffersPage = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const { data } = await axios.get('/api/public/offers');
                const activeOffers = data.filter(offer => offer.isActive && new Date(offer.expiryDate) > new Date());
                setOffers(activeOffers);
            } catch (err) {
                console.error("Failed to fetch offers", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-dark flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white mt-4 tracking-widest uppercase text-sm">Loading Offers...</p>
            </div>
        );
    }

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
                        <Tag size={20} className="text-primary" />
                        <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-sm uppercase">
                            Special Deals
                        </h2>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        Current <span className="text-primary font-light">Offers</span>
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: '96px' }} transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    />
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-gray-400 font-sans mt-6 text-base max-w-xl mx-auto"
                    >
                        Take advantage of our seasonal discounts and exclusive packages to jumpstart your fitness journey.
                    </motion.p>
                </div>

                {offers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-sans">No active offers available at this time. Check back later!</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {offers.map((offer, idx) => {
                            const expiry = new Date(offer.expiryDate);
                            const now = new Date();
                            const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                            const isEndingSoon = diffDays <= 7 && diffDays > 0;

                            return (
                                <motion.div
                                    key={offer._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl group flex flex-col"
                                >
                                    {/* Image Container */}
                                    <div className="h-64 relative overflow-hidden bg-black/40">
                                        {offer.image ? (
                                            <img
                                                src={offer.image}
                                                alt={offer.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                                                <ImageIcon size={48} className="mb-2 opacity-50" />
                                                <span className="text-xs uppercase tracking-widest">Special Promo</span>
                                            </div>
                                        )}
                                        
                                        {/* Overlay Gradients */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent"></div>
                                        
                                        {/* Discount Badge */}
                                        {offer.discount && (
                                            <div className="absolute top-4 left-4 bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg shadow-lg rotate-[-2deg]">
                                                {offer.discount} OFF
                                            </div>
                                        )}
                                        {/* Ending Soon Badge */}
                                        {isEndingSoon && (
                                            <div className="absolute top-4 right-4 bg-red-500/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                                                <Clock size={12} /> Ends in {diffDays} {diffDays === 1 ? 'day' : 'days'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-grow relative -mt-4 bg-dark-card rounded-t-2xl z-10 border-t border-white/5">
                                        <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-primary transition-colors">
                                            {offer.title}
                                        </h3>
                                        <p className="text-gray-400 font-sans text-sm leading-relaxed mb-6 flex-grow">
                                            {offer.description}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 text-gray-500 text-xs font-sans tracking-wide pt-4 border-t border-white/5">
                                            <Calendar size={14} className="text-primary" />
                                            Valid until: <span className="text-gray-300 font-semibold">{expiry.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default OffersPage;
