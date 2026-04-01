import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Calendar, TrendingUp, Clock, FileText } from 'lucide-react';
import socket from '../../utils/socket';

const SummaryDashboard = () => {
    const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
    const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
    const [summaryData, setSummaryData] = useState(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            setIsSummaryLoading(true);
            try {
                const token = localStorage.getItem('gymToken');
                const { data } = await axios.get(`/api/admin/summary?month=${summaryMonth}&year=${summaryYear}&t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSummaryData(data);
            } catch (err) {
                console.error('Failed to fetch summary data', err);
            } finally {
                setIsSummaryLoading(false);
            }
        };

        const fetchSummarySilent = async () => {
            try {
                const token = localStorage.getItem('gymToken');
                const { data } = await axios.get(`/api/admin/summary?month=${summaryMonth}&year=${summaryYear}&t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSummaryData(data);
            } catch (err) {}
        };

        fetchSummary();

        const onDbChange = () => {
            console.log('Socket event received: db_changed (Summary)');
            fetchSummarySilent();
        };

        socket.on('db_changed', onDbChange);

        const intervalId = setInterval(() => {
            fetchSummarySilent();
        }, 20000);

        return () => {
            clearInterval(intervalId);
            socket.off('db_changed', onDbChange);
        };
    }, [summaryMonth, summaryYear]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-900">Summary Dashboard</h1>
                    <p className="text-indigo-600 text-sm mt-1">View detailed monthly analytics and member activities</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Periodic Summary</h2>
                        <p className="text-sm text-gray-500">
                            {summaryData ? (
                                summaryData.newMembersCount === 0 && summaryData.subscriptionsCount === 0 && summaryData.expirationsCount === 0 
                                ? "No data available for this period" 
                                : `Showing data for ${new Date(summaryYear, summaryMonth - 1).toLocaleString('default', { month: 'long' })} ${summaryYear}`
                            ) : "Loading summary data..."}
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => {
                                const d = new Date();
                                setSummaryMonth(d.getMonth() + 1);
                                setSummaryYear(d.getFullYear());
                            }}
                            className="px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            This Month
                        </button>

                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <select 
                                value={summaryMonth} 
                                onChange={(e) => setSummaryMonth(Number(e.target.value))}
                                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            
                            <select 
                                value={summaryYear} 
                                onChange={(e) => setSummaryYear(Number(e.target.value))}
                                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer border-l pl-2 border-gray-300 ml-1"
                            >
                                {Array.from({ length: (new Date().getFullYear() + 5) - 2020 + 1 }, (_, i) => 2020 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-blue-800 font-semibold text-sm">New Members</h3>
                            <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600"/></div>
                        </div>
                        <p className="text-3xl font-bold text-blue-900 mt-4">
                            {isSummaryLoading ? '...' : summaryData?.newMembersCount || 0}
                        </p>
                    </div>

                    <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-emerald-800 font-semibold text-sm">New Subscriptions</h3>
                            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600"/></div>
                        </div>
                        <p className="text-3xl font-bold text-emerald-900 mt-4">
                            {isSummaryLoading ? '...' : summaryData?.subscriptionsCount || 0}
                        </p>
                    </div>

                    <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-rose-800 font-semibold text-sm">Expirations</h3>
                            <div className="p-2 bg-rose-100 rounded-lg"><Clock className="w-5 h-5 text-rose-600"/></div>
                        </div>
                        <p className="text-3xl font-bold text-rose-900 mt-4">
                            {isSummaryLoading ? '...' : summaryData?.expirationsCount || 0}
                        </p>
                    </div>
                </div>

                {!isSummaryLoading && summaryData && (
                    <div className="space-y-8 mt-8">
                        {/* New Members List */}
                        {summaryData.newMembers && summaryData.newMembers.length > 0 && (
                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-800">New Members List</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">Name</th>
                                                <th className="px-6 py-3 font-semibold">Email</th>
                                                <th className="px-6 py-3 font-semibold">Phone</th>
                                                <th className="px-6 py-3 font-semibold">Registration Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summaryData.newMembers.map((member) => (
                                                <tr key={member._id} className="border-b hover:bg-gray-50/50">
                                                    <td className="px-6 py-3 font-medium text-gray-900">{member.name}</td>
                                                    <td className="px-6 py-3 text-gray-500">{member.email}</td>
                                                    <td className="px-6 py-3 text-gray-500">{member.phone}</td>
                                                    <td className="px-6 py-3 text-gray-500">{new Date(member.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Subscriptions List */}
                        {summaryData.subscriptions && summaryData.subscriptions.length > 0 && (
                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-800">Plan Subscriptions</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">User Name</th>
                                                <th className="px-6 py-3 font-semibold">Plan Name</th>
                                                <th className="px-6 py-3 font-semibold">Start Date</th>
                                                <th className="px-6 py-3 font-semibold">End Date</th>
                                                <th className="px-6 py-3 font-semibold">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summaryData.subscriptions.map((sub) => (
                                                <tr key={sub._id} className="border-b hover:bg-gray-50/50">
                                                    <td className="px-6 py-3 font-medium text-gray-900">{sub.userName}</td>
                                                    <td className="px-6 py-3 text-indigo-600">{sub.packageName}</td>
                                                    <td className="px-6 py-3 text-gray-500">{new Date(sub.startDate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 text-gray-500">{new Date(sub.endDate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 font-medium">₹{sub.amountPaid || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Expiring Plans List */}
                        {summaryData.expirations && summaryData.expirations.length > 0 && (
                            <div className="bg-white border text-left border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="font-bold text-gray-800">Plan Expirations</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 font-semibold">User Name</th>
                                                <th className="px-6 py-3 font-semibold">Plan Name</th>
                                                <th className="px-6 py-3 font-semibold">Expiry Date</th>
                                                <th className="px-6 py-3 font-semibold">Days Remaining</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summaryData.expirations.map((exp) => {
                                                const diffDays = Math.ceil((new Date(exp.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <tr key={exp._id} className="border-b hover:bg-gray-50/50">
                                                        <td className="px-6 py-3 font-medium text-gray-900">{exp.userName}</td>
                                                        <td className="px-6 py-3 text-indigo-600">{exp.packageName}</td>
                                                        <td className="px-6 py-3 text-gray-500">{new Date(exp.endDate).toLocaleDateString()}</td>
                                                        <td className="px-6 py-3">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${diffDays < 0 ? 'bg-red-100 text-red-700' : diffDays <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                                {diffDays < 0 ? 'Expired' : `${diffDays} days`}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SummaryDashboard;
