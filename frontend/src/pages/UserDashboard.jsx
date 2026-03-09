import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Activity, CalendarDays, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const userName = user?.name || 'Member';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-dark pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-white text-3xl font-display font-bold tracking-wider uppercase">
                            WELCOME BACK, <span className="text-primary">{userName}</span>
                        </h1>
                        <p className="text-gray-400 mt-2 font-sans">Ready to crush your goals today?</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-semibold transition-all self-start md:self-auto"
                    >
                        <LogOut className="w-5 h-5 text-primary" />
                        SIGN OUT
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1 space-y-8"
                    >
                        {/* Profile Summary */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-white capitalize">{userName}</h2>
                                    <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 mt-1">
                                        Active Member
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Next Renewal:</span>
                                    <span className="text-white font-semibold">Dec 31, 2026</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Current Plan:</span>
                                    <span className="text-white font-semibold flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary" /> Pro
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-display font-bold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10">
                                    <span className="text-white">Book a Class</span>
                                    <CalendarDays className="w-5 h-5 text-gray-400" />
                                </button>
                                <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10">
                                    <span className="text-white">View History</span>
                                    <Activity className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Activity / Main Content Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 glass-card p-8 rounded-2xl border border-white/10 min-h-[500px] flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <CalendarDays className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white mb-2">No Upcoming Classes</h2>
                        <p className="text-gray-400 max-w-md">
                            You haven't booked any classes or Personal Training sessions yet. Check out the schedule to get started.
                        </p>
                        <button className="mt-8 px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors tracking-wider shadow-[0_0_15px_rgba(227,74,41,0.3)]">
                            VIEW SCHEDULE
                        </button>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
