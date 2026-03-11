import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, MessageSquare, ArrowRight, CheckCircle, Dumbbell } from 'lucide-react';
import axios from 'axios';

const BookPTSession = () => {
    const [searchParams] = useSearchParams();
    const preSelectedTrainer = searchParams.get('trainer') || 'Any Available Trainer';

    const [formData, setFormData] = useState({
        type: 'pt-session',
        name: '',
        email: '',
        phone: '',
        service: preSelectedTrainer,
        date: '',
        message: ''
    });
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

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
                setFormData({ ...formData, name: '', email: '', phone: '', message: '', date: '' });
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
        <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-dark">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full glass-card p-8 md:p-12 rounded-2xl relative z-10 shadow-2xl border-white/10"
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
                        <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-wider">REQUEST SENT</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                            Your personal training request has been sent! Your trainer will contact you shortly to confirm the scheduled time.
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="text-primary hover:text-white transition-colors font-semibold tracking-wider font-sans uppercase text-sm"
                        >
                            Book Another Session
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-10">
                            <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-xs mb-2 uppercase">1-on-1 Focus</h2>
                            <h1 className="text-white text-4xl font-display font-bold uppercase tracking-wider">Book PT Session</h1>
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

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        name="phone" type="tel" disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        placeholder="Phone Number"
                                        value={formData.phone} onChange={handleChange}
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        name="date" type="datetime-local" required disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        value={formData.date} onChange={handleChange}
                                    />
                                </div>

                                <div className="relative md:col-span-2">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Dumbbell className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        name="service" required disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        value={formData.service} onChange={handleChange}
                                    >
                                        <option value="Any Available Trainer">Any Available Trainer</option>
                                        <option value="Tara Parmar">Tara Parmar</option>
                                        <option value="Atharva Chavan">Atharva Chavan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute top-4 left-0 pl-3 flex items-start pointer-events-none">
                                    <MessageSquare className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    name="message" disabled={status === 'submitting'} required
                                    className="appearance-none rounded-lg relative block w-full min-h-[120px] pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors resize-none"
                                    placeholder="What are your goals for this session? *"
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
                                    {status === 'submitting' ? 'PROCESSING...' : 'REQUEST SESSION'}
                                    {!status === 'submitting' && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default BookPTSession;
