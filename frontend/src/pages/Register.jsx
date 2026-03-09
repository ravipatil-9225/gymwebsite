import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
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

    const handleGoogleSuccess = (credentialResponse) => {
        if (credentialResponse.credential) {
            const decodedInfo = jwtDecode(credentialResponse.credential);
            console.log('Google Signup Success! User Info:', decodedInfo);
            login({ name: decodedInfo.name, email: decodedInfo.email });
            navigate('/home');
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
                className="max-w-md w-full glass-card p-8 rounded-2xl relative z-10 shadow-2xl border-white/10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-xs mb-2 uppercase">Join The Elite</h2>
                    <h1 className="text-white text-3xl font-display font-bold uppercase tracking-wider">Create Account</h1>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>

                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

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
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
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
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-4 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-[0_0_15px_rgba(227,74,41,0.3)] tracking-wider disabled:opacity-60"
                        >
                            {loading ? <Loader size={18} className="animate-spin" /> : 'REGISTER'}
                            {!loading && <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-dark-card text-gray-400 font-sans text-xs">OR CONTINUE WITH</span>
                        </div>
                    </div>

                    <div className="flex justify-center flex-col items-center max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/5 p-1 pt-1.5 hover:bg-white/10 transition-colors">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                console.log('Signup Failed');
                                alert("Google registration failed. Please try again.");
                            }}
                            theme="filled_black"
                            shape="rectangular"
                            size="large"
                            text="signup_with"
                            width="300"
                        />
                    </div>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:text-white transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
