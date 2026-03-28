import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Star, MessageSquare, ArrowRight, CheckCircle, MessageSquareQuote } from 'lucide-react';
import axios from 'axios';
import socket from '../../utils/socket';

const FeedbackForm = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [formData, setFormData] = useState({
        type: 'feedback',
        name: '',
        email: '',
        rating: '5',
        message: ''
    });
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const { data } = await axios.get('/api/public/all-feedbacks');
                setFeedbacks(data);
            } catch (err) { }
        };

        fetchFeedbacks();
        socket.on('db_changed', fetchFeedbacks);
        return () => socket.off('db_changed', fetchFeedbacks);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            const response = await axios.post('/api/forms', formData);

            if (response.data.success) {
                setStatus('success');
                setFormData({ ...formData, name: '', email: '', message: '', rating: '5' });
            } else {
                setStatus('error');
                setErrorMessage(response.data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
            setErrorMessage(error.response?.data?.message || 'Network error. Please make sure the server is running.');
        }
    };

    return (
        <>
        <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-dark">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl max-w-2xl mx-auto w-full glass-card p-8 md:p-12 rounded-2xl relative z-10 shadow-2xl border-white/10"
            >
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </motion.div>
                        <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-wider">FEEDBACK RECEIVED</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                            Thank you for your valuable feedback! We're always striving to improve Tara Fitness.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-primary hover:text-white transition-colors font-semibold tracking-wider font-sans uppercase text-sm"
                        >
                            Submit More Feedback
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-10">
                            <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-xs mb-2 uppercase">Help Us Improve</h2>
                            <h1 className="text-white text-4xl font-display font-bold uppercase tracking-wider">Member Feedback</h1>
                            <p className="text-gray-400 mt-4 max-w-lg mx-auto">
                                How was your experience? Let us know what you love and where we can do better.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        name="name" type="text" required disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        placeholder="Full Name *"
                                        value={formData.name} onChange={handleChange}
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        name="email" type="email" required disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        placeholder="Email Address *"
                                        value={formData.email} onChange={handleChange}
                                    />
                                </div>

                                <div className="relative md:col-span-2">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Star className="h-5 w-5 text-primary" />
                                    </div>
                                    <select
                                        name="rating" required disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        value={formData.rating} onChange={handleChange}
                                    >
                                        <option value="5">5/5 - Excellent</option>
                                        <option value="4">4/5 - Very Good</option>
                                        <option value="3">3/5 - Average</option>
                                        <option value="2">2/5 - Poor</option>
                                        <option value="1">1/5 - Terrible</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute top-4 left-0 pl-3 flex items-start pointer-events-none">
                                    <MessageSquare className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    name="message" disabled={status === 'submitting'} required
                                    className="appearance-none rounded-lg relative block w-full min-h-[150px] pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors resize-none"
                                    placeholder="Please share your feedback or suggestions... *"
                                    value={formData.message} onChange={handleChange}
                                />
                            </div>

                            {status === 'error' && (
                                <div className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit" disabled={status === 'submitting'}
                                    className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-white transition-all shadow-[0_0_15px_rgba(227,74,41,0.3)] tracking-wider disabled:opacity-50"
                                >
                                    {status === 'submitting' ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
                                    {!status === 'submitting' && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>

        {/* Public Feedback Section Below the Form - always shown */}
        <div className="w-full bg-[#030303] py-24 relative border-t border-white/5 z-10" id="see-feedback">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-white text-3xl md:text-4xl font-display font-black uppercase tracking-tight"
                    >
                        See <span className="text-primary">All Feedback</span>
                    </motion.h2>
                    <div className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-6 w-16" />
                    <p className="text-gray-500 mt-4 text-sm font-sans">Live feedback from all our gym members</p>
                </div>

                {feedbacks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-sans">
                        No feedback yet. Be the first to share your experience!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feedbacks.map((fb, idx) => (
                            <motion.div
                                key={fb._id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-dark-card border border-white/5 p-8 rounded-2xl relative shadow-2xl group flex flex-col"
                            >
                                <MessageSquareQuote className="absolute top-6 right-6 w-8 h-8 text-white/[0.03] group-hover:text-primary/10 transition-colors duration-500" />
                                
                                <div className="flex items-center gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={16} 
                                            className={i < fb.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"} 
                                        />
                                    ))}
                                </div>

                                <p className="text-gray-300 font-sans text-sm leading-relaxed mb-8 flex-grow italic">
                                    "{fb.message}"
                                </p>

                                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <User size={16} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-display font-bold text-sm tracking-wide capitalize">{fb.name}</h4>
                                        <p className="text-gray-500 text-xs font-sans">
                                            {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default FeedbackForm;
