import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, PhoneCall, HandCoins, Activity, Cake, Gift, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import socket from '../../utils/socket';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeMembers: 0,
        totalEnquiries: 0,
        pendingPayments: 0,
        recentActivities: [],
        chartData: []
    });
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const [analyticsRes, birthdaysRes] = await Promise.all([
                    axios.get(`/api/admin/analytics?t=${Date.now()}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`/api/admin/birthdays/today?t=${Date.now()}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setStats(analyticsRes.data);
                setBirthdays(birthdaysRes.data.users || []);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchAnalyticsSilent = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const [analyticsRes, birthdaysRes] = await Promise.all([
                    axios.get(`/api/admin/analytics?t=${Date.now()}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`/api/admin/birthdays/today?t=${Date.now()}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setStats(analyticsRes.data);
                setBirthdays(birthdaysRes.data.users || []);
            } catch (err) {}
        };

        const onDbChange = () => {
            console.log('Socket event received: db_changed (Dashboard)');
            fetchAnalyticsSilent();
        };

        fetchAnalytics();

        socket.on('db_changed', onDbChange);

        const intervalId = setInterval(() => {
            fetchAnalyticsSilent();
        }, 20000);

        return () => {
            clearInterval(intervalId);
            socket.off('db_changed', onDbChange);
        };
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    const statCards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/users' },
        { title: 'Active Members', value: stats.activeMembers, icon: Activity, color: 'text-green-600', bg: 'bg-green-100', link: '/admin/summary' },
        { title: 'Total Enquiries', value: stats.totalEnquiries, icon: PhoneCall, color: 'text-yellow-600', bg: 'bg-yellow-100', link: '/admin/enquiries' },
        { title: 'Pending Payments', value: stats.pendingPayments, icon: HandCoins, color: 'text-red-600', bg: 'bg-red-100', link: '/admin/payments' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-900">Dashboard Overview</h1>
                    <p className="text-indigo-600 text-sm mt-1">Manage and monitor your gym website</p>
                </div>
                <button 
                    onClick={async () => {
                        if(window.confirm('Are you running this on the Live Server? This will instantly populate the database with your original Plans, Trainers, and Gallery photos. Continue?')) {
                            try {
                                const t = localStorage.getItem('adminToken');
                                const {data} = await axios.post('/api/admin/system/restore-legacy', {}, { headers: { Authorization: `Bearer ${t}` } });
                                alert(data.message);
                            } catch(err) { alert('Error restoring legacy data'); }
                        }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold flex items-center gap-2"
                >
                    <Activity className="w-4 h-4" /> Initialize Live Data
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={idx} to={stat.link} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                            <div className={`p-4 rounded-lg ${stat.bg} mr-4`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Growth Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Audience Metrics Over Time</h2>
                <div className="h-80 w-full">
                    {stats.chartData && stats.chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="users" name="New Users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="enquiries" name="Enquiries" stroke="#82ca9d" fillOpacity={1} fill="url(#colorEnquiries)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">Not enough data to graph</div>
                    )}
                </div>
            </div>

            {/* Recent Activity and Birthdays Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Recent Form Submissions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Recent Form Submissions</h2>
                    </div>
                    <div className="p-0 flex-1">
                        {stats.recentActivities.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-sm">
                                            <th className="px-6 py-4 font-medium">Name</th>
                                            <th className="px-6 py-4 font-medium">Type</th>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {stats.recentActivities.map((act) => (
                                            <tr key={act._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{act.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs uppercase tracking-wider">
                                                        {act.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {new Date(act.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 text-gray-500">No recent activity.</div>
                        )}
                    </div>
                </div>

                {/* Today's Birthdays Widget */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Cake className="w-5 h-5 text-pink-500" /> Today's Birthdays
                        </h2>
                        <span className="bg-pink-100 text-pink-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                            {birthdays.length} Live
                        </span>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto max-h-[350px] space-y-4">
                        {birthdays.length > 0 ? (
                            birthdays.map((user) => {
                                const wa = user.phone ? `https://wa.me/${user.phone.replace(/[^0-9]/g, '').replace(/^(?!91)/, '91')}?text=${encodeURIComponent(`🎂 Happy Birthday ${user.name}! 🎉\n\nWishing you a fantastic birthday from all of us at Tara Fitness! Stay strong and keep crushing your goals! 💪🏋️`)}` : null;

                                return (
                                    <div key={user._id} className="flex items-center justify-between p-3.5 bg-pink-50/50 rounded-xl border border-pink-100/50 hover:bg-pink-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden flex-shrink-0">
                                                {user.profileImage?.url ? (
                                                    <img src={user.profileImage.url} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    user.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
                                                )}
                                            </div>
                                            <div>
                                                <Link to={`/admin/users/${user._id}`} className="text-sm font-bold text-gray-800 hover:text-pink-600 transition-colors hover:underline">
                                                    {user.name}
                                                </Link>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    {user.age ? `Turns ${user.age}` : 'Birthday today'} 🎉
                                                </p>
                                            </div>
                                        </div>

                                        {wa && (
                                            <a href={wa} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center" title="Send wishes on WhatsApp">
                                                <MessageSquare className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
                                <Gift className="w-10 h-10 text-gray-200 mb-2" />
                                <p className="text-sm font-medium">No Birthdays Today</p>
                                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">We'll display dynamic updates here as they sync live.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center rounded-b-xl">
                        <Link to="/admin/birthdays" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                            View All & Send Wishes →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
