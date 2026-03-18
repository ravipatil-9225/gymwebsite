import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { CheckCircle, XCircle, Clock, FileText, Banknote, CreditCard } from 'lucide-react';

const STATUS_LABELS = {
    auto_verified: { label: 'Auto Verified',     bg: 'bg-green-100 text-green-700 border-green-200',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    manually_verified: { label: 'Manually Verified', bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    cash_pending:  { label: 'Cash Pending',       bg: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Banknote className="w-3.5 h-3.5" /> },
    cash_collected:{ label: 'Cash Collected',     bg: 'bg-green-100 text-green-700 border-green-200',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    pending:       { label: 'Pending Review',     bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-3.5 h-3.5" /> },
    failed_verification: { label: 'Failed OCR',   bg: 'bg-red-100 text-red-700 border-red-200',       icon: <XCircle className="w-3.5 h-3.5" /> },
    rejected:      { label: 'Rejected',           bg: 'bg-gray-100 text-gray-700 border-gray-200',    icon: <XCircle className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_LABELS[status] || { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg}`}>
            {s.icon} {s.label}
        </span>
    );
};

const PaymentsManager = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all'); // 'all' | 'upi' | 'cash'

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/payments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(data);
        } catch (err) {
            console.error('Failed to fetch payments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
        socket.on('db_changed', fetchPayments);
        return () => socket.off('db_changed', fetchPayments);
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('gymToken');
            await axios.put(`/api/admin/payments/${id}`, { verificationStatus: status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPayments();
        } catch (err) {
            alert('Error updating payment status');
            console.error(err);
        }
    };

    const filtered = payments.filter(p => {
        if (tab === 'upi') return p.paymentMethod !== 'cash_on_bench';
        if (tab === 'cash') return p.paymentMethod === 'cash_on_bench';
        return true;
    });

    const cashPendingCount = payments.filter(p => p.verificationStatus === 'cash_pending').length;
    const upiPendingCount = payments.filter(p => p.verificationStatus === 'pending' || p.verificationStatus === 'failed_verification').length;

    if (loading) return <div className="p-8 text-gray-500">Loading payments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <div className="flex gap-2">
                    {cashPendingCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                            <Banknote className="w-3.5 h-3.5" /> {cashPendingCount} Cash Pending
                        </span>
                    )}
                    {upiPendingCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                            <Clock className="w-3.5 h-3.5" /> {upiPendingCount} UPI Pending
                        </span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { key: 'all',  label: 'All Payments' },
                    { key: 'upi',  label: 'UPI / Online', icon: <CreditCard className="w-3.5 h-3.5" /> },
                    { key: 'cash', label: 'Cash on Bench', icon: <Banknote className="w-3.5 h-3.5" /> },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t.icon} {t.label}
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
                            {t.key === 'all' ? payments.length : t.key === 'cash' ? payments.filter(p => p.paymentMethod === 'cash_on_bench').length : payments.filter(p => p.paymentMethod !== 'cash_on_bench').length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                            <tr>
                                <th className="px-5 py-4">User</th>
                                <th className="px-5 py-4">Plan</th>
                                <th className="px-5 py-4">Method</th>
                                <th className="px-5 py-4">Transaction / Notes</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filtered.map(payment => {
                                const isCash = payment.paymentMethod === 'cash_on_bench';
                                return (
                                    <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-gray-900">{payment.userName}</div>
                                            <div className="text-xs text-gray-500">{payment.email}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-gray-900 font-medium">{payment.planName}</div>
                                            <div className="text-gray-500 text-xs">₹{payment.planPrice}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {isCash ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                                    <Banknote className="w-3 h-3" /> Cash
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    <CreditCard className="w-3 h-3" /> UPI
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 max-w-[200px]">
                                            {isCash ? (
                                                <span className="text-gray-400 text-xs italic">Pay at reception</span>
                                            ) : (
                                                <>
                                                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs select-all block mb-1 truncate max-w-[180px]">
                                                        {payment.transactionId}
                                                    </code>
                                                    {payment.extractedTransactionId && (
                                                        <code className={`px-2 py-1 rounded text-xs select-all ${payment.extractedTransactionId === payment.transactionId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            OCR: {payment.extractedTransactionId}
                                                        </code>
                                                    )}
                                                    {payment.ocrConfidence && (
                                                        <div className="text-xs text-gray-400 mt-0.5">Conf: {payment.ocrConfidence.toFixed(1)}%</div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge status={payment.verificationStatus} />
                                        </td>
                                        <td className="px-5 py-4 text-right space-x-1">
                                            {/* View screenshot for UPI */}
                                            {!isCash && payment.screenshotUrl && (
                                                <button
                                                    onClick={() => window.open(payment.screenshotUrl, '_blank')}
                                                    className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Screenshot"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Cash payment actions */}
                                            {isCash && payment.verificationStatus === 'cash_pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(payment._id, 'cash_collected')}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 font-medium"
                                                        title="Mark Cash Collected"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Collected
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(payment._id, 'rejected')}
                                                        className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {/* UPI failed/pending actions */}
                                            {!isCash && (payment.verificationStatus === 'failed_verification' || payment.verificationStatus === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(payment._id, 'manually_verified')}
                                                        className="inline-flex items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                                                        title="Approve Manually"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(payment._id, 'rejected')}
                                                        className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                                        title="Reject Payment"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                                        No payment records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentsManager;
