import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import socket from '../../utils/socket';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await axios.get('/api/public/reviews');
                setReviews(data);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            }
        };

        fetchReviews();
        socket.on('db_changed', fetchReviews);
        return () => socket.off('db_changed', fetchReviews);
    }, []);

    if (reviews.length === 0) return null; // Don't show the section if no reviews exist

    return (
        <section className="py-24 relative border-t border-white/[0.04] overflow-hidden bg-dark">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-4 text-primary tracking-[0.2em] font-sans font-semibold text-sm uppercase"
                    >
                        Member Feedback
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl font-display font-black uppercase tracking-tight"
                    >
                        See <span className="text-gradient">Feedback</span>
                    </motion.h2>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-[2px] bg-gradient-to-r from-primary to-transparent mx-auto mt-6 w-24 origin-left"
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review._id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-dark-card border border-white/5 p-8 rounded-2xl relative shadow-2xl group flex flex-col hover:-translate-y-2 transition-transform duration-500"
                            style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' }}
                        >
                            <MessageSquareQuote className="absolute top-6 right-6 w-10 h-10 text-white/[0.03] group-hover:text-primary/10 transition-colors duration-500" />
                            
                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={18} 
                                        className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"} 
                                    />
                                ))}
                            </div>

                            <p className="text-gray-300 font-sans text-sm leading-relaxed mb-8 flex-grow italic">
                                "{review.message}"
                            </p>

                            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <User size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-white font-display font-bold text-sm tracking-wide capitalize">{review.name}</h4>
                                    <p className="text-gray-500 text-xs font-sans">Verified Member</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Call to action button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <Link
                        to="/forms/feedback"
                        className="group inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold tracking-[0.1em] uppercase px-8 py-4 rounded-xl border border-white/10 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(227,74,41,0.25)]"
                    >
                        <MessageSquareQuote size={18} className="text-primary group-hover:scale-110 transition-transform" />
                        Give Feedback
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-2 text-white/40 group-hover:text-white" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default Reviews;
