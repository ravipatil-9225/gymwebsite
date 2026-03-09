import React, { useContext, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, User, Activity, CalendarDays, TrendingUp,
    Moon, Sun, Settings as SettingsIcon, Camera, Edit3,
    Save, X, Phone, Mail, Target, Cake, CheckCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const FITNESS_GOALS = [
    'Weight Loss', 'Muscle Gain', 'Strength Training',
    'Cardio & Endurance', 'General Fitness', 'Body Transformation'
];

const Settings = () => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();

    // Edit state
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dob: user?.dob || '',
        goal: user?.goal || '',
    });

    // Photo upload
    const fileInputRef = useRef(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            updateUser({ photo: ev.target.result });
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        updateUser(form);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleCancel = () => {
        setForm({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            dob: user?.dob || '',
            goal: user?.goal || '',
        });
        setEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-dark pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {/* Background glows */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-white text-3xl font-display font-bold tracking-wider uppercase">
                            ACCOUNT <span className="text-primary">SETTINGS</span>
                        </h1>
                        <p className="text-gray-400 mt-2 font-sans">Manage your profile, preferences, and activity.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 rounded-lg text-white font-semibold transition-all self-start md:self-auto"
                    >
                        <LogOut className="w-5 h-5 text-primary" />
                        SIGN OUT
                    </button>
                </div>

                {/* Saved toast */}
                <AnimatePresence>
                    {saved && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl font-sans text-sm font-semibold"
                        >
                            <CheckCircle size={18} /> Profile saved successfully!
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── LEFT COLUMN ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-6">

                        {/* Profile Card */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            {/* Avatar */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative w-24 h-24 mb-4">
                                    {user?.photo ? (
                                        <img src={user.photo} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-primary/50 shadow-lg" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50 shadow-lg">
                                            <User className="w-10 h-10 text-primary" />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors shadow-lg border-2 border-dark"
                                        title="Change photo"
                                    >
                                        <Camera size={14} className="text-white" />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                </div>

                                {!editing ? (
                                    <div className="text-center">
                                        <h2 className="text-xl font-display font-bold text-white capitalize">{user?.name || 'Member'}</h2>
                                        <p className="text-gray-400 text-sm font-sans mt-1">{user?.email || ''}</p>
                                        <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 mt-2">
                                            Active Member
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            {/* Edit / Save controls */}
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 rounded-xl text-white text-sm font-semibold transition-all"
                                >
                                    <Edit3 size={15} /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover rounded-xl text-white text-sm font-bold transition-all"
                                    >
                                        <Save size={15} /> Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all"
                                    >
                                        <X size={15} /> Cancel
                                    </button>
                                </div>
                            )}

                            {/* Membership Info */}
                            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Next Renewal:</span>
                                    <span className="text-white font-semibold">Dec 31, 2026</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Current Plan:</span>
                                    <span className="text-white font-semibold flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4 text-primary" /> Pro
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-primary" /> Preferences
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-white font-medium">Theme Mode</p>
                                    <p className="text-xs text-gray-400 mt-1">Switch between light and dark</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${theme === 'dark' ? 'bg-primary' : 'bg-gray-400'}`}
                                >
                                    <span className="sr-only">Toggle theme</span>
                                    <span className={`inline-flex h-6 w-6 transform rounded-full bg-white transition-transform duration-300 items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}>
                                        {theme === 'dark' ? <Moon size={14} className="text-primary" /> : <Sun size={14} className="text-gray-500" />}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-display font-bold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    to="/forms/book-class"
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-primary/20 rounded-xl transition-colors border border-transparent hover:border-primary/30 group"
                                >
                                    <span className="text-white group-hover:text-primary transition-colors">Book a Class</span>
                                    <CalendarDays className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                </Link>
                                <Link
                                    to="/forms/book-pt"
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-primary/20 rounded-xl transition-colors border border-transparent hover:border-primary/30 group"
                                >
                                    <span className="text-white group-hover:text-primary transition-colors">Book PT Session</span>
                                    <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                </Link>
                                <Link
                                    to="/packages/plans"
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-primary/20 rounded-xl transition-colors border border-transparent hover:border-primary/30 group"
                                >
                                    <span className="text-white group-hover:text-primary transition-colors">View Plans</span>
                                    <Activity className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── RIGHT COLUMN ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Personal Information */}
                        <div className="glass-card p-8 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> Personal Information
                                </h2>
                                {!editing && (
                                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-primary hover:text-white text-sm font-semibold transition-colors">
                                        <Edit3 size={14} /> Edit
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                        <User size={12} /> Full Name
                                    </label>
                                    {editing ? (
                                        <input
                                            name="name" value={form.name} onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm transition-colors"
                                            placeholder="Your full name"
                                        />
                                    ) : (
                                        <p className="text-white font-medium text-sm py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                                            {user?.name || <span className="text-gray-500 italic">Not set</span>}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                        <Mail size={12} /> Email Address
                                    </label>
                                    {editing ? (
                                        <input
                                            name="email" type="email" value={form.email} onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm transition-colors"
                                            placeholder="your@email.com"
                                        />
                                    ) : (
                                        <p className="text-white font-medium text-sm py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                                            {user?.email || <span className="text-gray-500 italic">Not set</span>}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                        <Phone size={12} /> Phone Number
                                    </label>
                                    {editing ? (
                                        <input
                                            name="phone" type="tel" value={form.phone} onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm transition-colors"
                                            placeholder="+91 XXXXX XXXXX"
                                        />
                                    ) : (
                                        <p className="text-white font-medium text-sm py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                                            {user?.phone || <span className="text-gray-500 italic">Not set</span>}
                                        </p>
                                    )}
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                        <Cake size={12} /> Date of Birth
                                    </label>
                                    {editing ? (
                                        <input
                                            name="dob" type="date" value={form.dob} onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm transition-colors"
                                        />
                                    ) : (
                                        <p className="text-white font-medium text-sm py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                                            {user?.dob || <span className="text-gray-500 italic">Not set</span>}
                                        </p>
                                    )}
                                </div>

                                {/* Fitness Goal — spans full width */}
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                                        <Target size={12} /> Fitness Goal
                                    </label>
                                    {editing ? (
                                        <select
                                            name="goal" value={form.goal} onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white focus:outline-none text-sm transition-colors appearance-none"
                                        >
                                            <option value="" className="bg-gray-900">Select a goal…</option>
                                            {FITNESS_GOALS.map(g => (
                                                <option key={g} value={g} className="bg-gray-900">{g}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-white font-medium text-sm py-3 px-4 bg-white/5 rounded-xl border border-white/5">
                                            {user?.goal || <span className="text-gray-500 italic">Not set</span>}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {editing && (
                                <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(227,74,41,0.3)]"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-sm transition-all"
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Activity Panel */}
                        <div className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center min-h-[240px]">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <CalendarDays className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-display font-bold text-white mb-2">No Upcoming Classes</h2>
                            <p className="text-gray-400 max-w-sm text-sm font-sans">
                                You haven't booked any classes or Personal Training sessions yet. Check out the schedule to get started.
                            </p>
                            <Link
                                to="/forms/book-class"
                                className="mt-6 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors tracking-wider shadow-[0_0_15px_rgba(227,74,41,0.3)] text-sm"
                            >
                                BOOK A CLASS
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
