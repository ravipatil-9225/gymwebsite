import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, newPassword }),
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
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10 shadow-2xl border-white/10 text-center"
            >
                <div className="mb-8">
                    <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-xs mb-2 uppercase">Account Recovery</h2>
                    <h1 className="text-white text-3xl font-display font-bold uppercase tracking-wider">Reset Password</h1>
                </div>

                {!isSubmitted ? (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <p className="text-gray-400 text-sm mb-6">
                            Enter your email and new password to update your account.
                        </p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg text-left">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="newPassword"
                                type="password"
                                required
                                minLength="6"
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                minLength="6"
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-white transition-all shadow-[0_0_15px_rgba(227,74,41,0.3)] tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                                {!loading && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-4"
                    >
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                        <p className="text-gray-400 text-sm mb-8">
                            Your password has been successfully reset. You can now use your new password to log in.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block py-3 px-8 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
                        >
                            Go to Login
                        </Link>
                    </motion.div>
                )}

                {!isSubmitted && (
                    <div className="mt-8 text-center text-sm">
                        <Link to="/login" className="font-semibold text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
