import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, User, MessageSquareQuote, Loader2 } from 'lucide-react';
import axios from 'axios';
import socket from '../utils/socket';

const SeeFeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const { data } = await axios.get('/api/public/all-feedbacks');
                setFeedbacks(data);
            } catch (err) {
                console.error('Failed to fetch feedbacks', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchSilent = async () => {
            try {
                const { data } = await axios.get('/api/public/all-feedbacks');
                setFeedbacks(data);
            } catch (err) {}
        };

        fetchFeedbacks();
        socket.on('db_changed', fetchSilent);
        return () => socket.off('db_changed', fetchSilent);
    }, []);

    return (
        <div className="min-h-screen bg-dark py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-primary tracking-[0.2em] font-semibold text-sm uppercase mb-4"
                    >
                        Member Reviews
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-6xl font-display font-black uppercase tracking-tight"
                    >
                        See <span className="text-gradient">Feedback</span>
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                        className="h-[2px] bg-gradient-to-r from-primary to-transparent mx-auto mt-6 w-24 origin-left"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400 mt-6 text-base font-sans max-w-xl mx-auto"
                    >
                        Honest reviews from our members — updated in real time.
                    </motion.p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center py-24">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && feedbacks.length === 0 && (
                    <div className="text-center py-24 text-gray-500 font-sans">
                        No feedback has been submitted yet. Be the first!
                    </div>
                )}

                {/* Grid */}
                {!loading && feedbacks.length > 0 && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {feedbacks.map((fb) => (
                            <motion.div
                                key={fb._id}
                                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                                className="bg-dark-card border border-white/5 p-8 rounded-2xl relative shadow-2xl group flex flex-col hover:-translate-y-1 transition-transform duration-400"
                            >
                                <MessageSquareQuote className="absolute top-5 right-5 w-9 h-9 text-white/[0.03] group-hover:text-primary/10 transition-colors duration-500" />

                                {/* Stars */}
                                {fb.rating && (
                                    <div className="flex items-center gap-1 mb-5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={i < fb.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Message */}
                                <p className="text-gray-300 font-sans text-sm leading-relaxed flex-grow italic mb-8">
                                    "{fb.message || 'No message provided.'}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                        <User size={16} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-display font-bold text-sm tracking-wide capitalize">
                                            {fb.name}
                                        </h4>
                                        <p className="text-gray-500 text-xs font-sans mt-0.5">
                                            {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SeeFeedbackPage;
