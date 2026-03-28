import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to connect to the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-dark">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]" />
                <div className="absolute inset-0 bg-dots opacity-20" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md w-full relative z-10"
                style={{
                    background: 'linear-gradient(145deg, rgba(18,18,18,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                    padding: '40px',
                }}
            >
                <div className="text-center mb-10">
                    <p className="section-eyebrow mb-3 text-[11px]">Account Recovery</p>
                    <h1 className="text-white font-display text-4xl font-black uppercase tracking-tight">
                        Reset <span className="text-gradient">Password</span>
                    </h1>
                    <div className="w-12 h-px bg-gradient-to-r from-primary to-transparent mx-auto mt-4" />
                </div>

                {!isSubmitted ? (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <p className="text-gray-400 text-sm mb-6 text-center">
                            Enter the email associated with your account and we'll send you a secure link to reset your password.
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-left">
                                {error}
                            </div>
                        )}

                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                                style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center items-center py-4 px-4 text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-hover transition-all tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ boxShadow: '0 0 25px rgba(227,74,41,0.35)' }}
                            >
                                {loading ? 'SENDING LINK...' : 'SEND RESET LINK'}
                                {!loading && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-4 text-center"
                    >
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            We've sent a secure password reset link to <strong>{email}</strong>. It will expire in 15 minutes.
                        </p>
                    </motion.div>
                )}

                <div className="mt-8 text-center text-sm">
                    <Link to="/login" className="font-semibold text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
