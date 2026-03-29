import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setNotFound(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            return setError('Please enter a valid email address.');
        }

        if (!formData.password) {
            return setError('Password is required.');
        }

        setLoading(true);
        setError('');
        setNotFound(false);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });
            const data = await res.json();
            if (res.status === 404) { setNotFound(true); throw new Error(data.message); }
            if (!res.ok) throw new Error(data.message || 'Login failed');
            login(data.user, data.token);
            navigate('/home');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative">
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
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="section-eyebrow mb-3 text-[11px]">Welcome Back</p>
                    <h1 className="text-white font-display text-4xl font-black uppercase tracking-tight">
                        Member <span className="text-gradient">Login</span>
                    </h1>
                    <div className="w-12 h-px bg-gradient-to-r from-primary to-transparent mx-auto mt-4" />
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
                            />
                            <span className="text-xs text-gray-500">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-white transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={15} className="shrink-0" />
                                {error}
                            </div>
                            {notFound && (
                                <div className="mt-2 pt-2 border-t border-red-500/20 text-center text-xs">
                                    <span className="text-gray-500">No account? </span>
                                    <Link to="/register" className="text-primary font-semibold hover:text-white transition-colors">
                                        Register here
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center items-center py-4 px-4 text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-hover transition-all tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 0 25px rgba(227,74,41,0.35)', marginTop: '8px' }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 0 40px rgba(227,74,41,0.55)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 25px rgba(227,74,41,0.35)')}
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : 'SIGN IN'}
                        {!loading && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    New to Tara Fitness?{' '}
                    <Link to="/register" className="font-bold text-primary hover:text-white transition-colors">
                        Create an account
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
