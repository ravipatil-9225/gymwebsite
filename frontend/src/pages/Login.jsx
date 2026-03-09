import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
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


    const handleGoogleSuccess = (credentialResponse) => {
        if (credentialResponse.credential) {
            const decodedInfo = jwtDecode(credentialResponse.credential);
            console.log('Google Login Success! User Info:', decodedInfo);
            alert(`Welcome ${decodedInfo.name} !(Google authentication successful)`);
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
                    <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-xs mb-2 uppercase">Welcome Back</h2>
                    <h1 className="text-white text-3xl font-display font-bold uppercase tracking-wider">Member Login</h1>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>

                    <div className="space-y-4">
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
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-600 bg-dark text-primary focus:ring-primary focus:ring-offset-gray-900"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link to="/reset-password" className="font-semibold text-primary hover:text-white transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                {error}
                            </div>
                            {notFound && (
                                <div className="mt-2 pt-2 border-t border-red-500/20 text-center">
                                    <span className="text-gray-400">Don't have an account? </span>
                                    <Link to="/register" className="text-primary font-semibold hover:text-white transition-colors">
                                        Register here
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-[0_0_15px_rgba(227,74,41,0.3)] tracking-wider disabled:opacity-60"
                        >
                            {loading ? <Loader size={18} className="animate-spin" /> : 'SIGN IN'}
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
                                console.log('Login Failed');
                                alert("Google authentication failed. Please try again.");
                            }}
                            theme="filled_black"
                            shape="rectangular"
                            size="large"
                            text="continue_with"
                            width="300"
                        />
                    </div>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-gray-400">
                        New to Tara Fitness?{' '}
                        <Link to="/register" className="font-semibold text-primary hover:text-white transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
