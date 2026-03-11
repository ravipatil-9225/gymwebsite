import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, PhoneCall, HandCoins, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeMembers: 0,
        totalEnquiries: 0,
        pendingPayments: 0,
        recentActivities: [],
        chartData: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('gymToken');
                const { data } = await axios.get('/api/admin/analytics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();

        // Auto-refresh every 5 seconds to keep stats real-time
        const intervalId = setInterval(() => {
            fetchAnalyticsSilent();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchAnalyticsSilent = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (err) {
            // Silently fail on background sync
        }
    };

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    const statCards = [
        { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Active Members', value: stats.activeMembers, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Total Enquiries', value: stats.totalEnquiries, icon: PhoneCall, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { title: 'Pending Payments', value: stats.pendingPayments, icon: HandCoins, color: 'text-red-600', bg: 'bg-red-100' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
                            <div className={`p-4 rounded-lg ${stat.bg} mr-4`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
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

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Recent Form Submissions</h2>
                </div>
                <div className="p-0">
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
        </div>
    );
};

export default Dashboard;
