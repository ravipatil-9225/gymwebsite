import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || formData.name.trim().length < 2) {
            return setError('Full name must be at least 2 characters long.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            return setError('Please enter a valid email address.');
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
        }

        // Phone is required and must be a valid 10-digit Indian number
        if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            return setError('Please enter a valid 10-digit Indian mobile number (starting with 6–9).');
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
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
            {/* Background */}
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
                    <p className="section-eyebrow mb-3 text-[11px]">Join The Elite</p>
                    <h1 className="text-white font-display text-4xl font-black uppercase tracking-tight">
                        Create <span className="text-gradient">Account</span>
                    </h1>
                    <div className="w-12 h-px bg-gradient-to-r from-primary to-transparent mx-auto mt-4" />
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Full Name */}
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                            placeholder="Full Name *"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Contact Number */}
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                        <input
                            name="phone"
                            type="tel"
                            required
                            maxLength={10}
                            pattern="[6-9][0-9]{9}"
                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                            placeholder="Contact Number * (10 digits)"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email */}
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                            placeholder="Email Address *"
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
                            placeholder="Password *"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/8 focus:border-primary/60 rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 text-sm"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
                            placeholder="Confirm Password *"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center items-center py-4 px-4 text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-hover transition-all tracking-wider disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        style={{ boxShadow: '0 0 25px rgba(227,74,41,0.35)' }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = '0 0 40px rgba(227,74,41,0.55)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 25px rgba(227,74,41,0.35)')}
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : 'CREATE ACCOUNT'}
                        {!loading && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <p className="text-gray-600 text-[11px] text-center">
                        All fields marked <span className="text-primary">*</span> are required. Your contact number is used for membership updates only.
                    </p>
                </form>

                {/* Footer */}
                <p className="mt-7 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-primary hover:text-white transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
