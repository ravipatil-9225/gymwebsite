import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { CheckCircle, XCircle, Search, Clock, FileText, Download } from 'lucide-react';

const PaymentsManager = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8">Loading payments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">UPI Payment Verifications</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Plan Details</th>
                                <th className="px-6 py-4">Submitted TXN ID</th>
                                <th className="px-6 py-4">OCR Extracted TXN ID</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {payments.map(payment => (
                                <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{payment.userName}</div>
                                        <div className="text-xs text-gray-500">{payment.email}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-medium">{payment.planName}</div>
                                        <div className="text-gray-500 text-xs">Amt: ₹{payment.planPrice}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs select-all">
                                            {payment.transactionId}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className={`px-2 py-1 rounded text-xs select-all ${payment.extractedTransactionId === payment.transactionId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {payment.extractedTransactionId || 'Not matched'}
                                        </code>
                                        {payment.ocrConfidence && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                OCR Conf: {(payment.ocrConfidence).toFixed(1)}%
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {payment.verificationStatus === 'auto_verified' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Auto Verified
                                            </span>
                                        )}
                                        {payment.verificationStatus === 'pending' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                <Clock className="w-3.5 h-3.5" /> Pending
                                            </span>
                                        )}
                                        {payment.verificationStatus === 'failed_verification' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                                <XCircle className="w-3.5 h-3.5" /> Failed OCR
                                            </span>
                                        )}
                                        {payment.verificationStatus === 'manually_verified' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Manually Verified
                                            </span>
                                        )}
                                        {payment.verificationStatus === 'rejected' && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                <XCircle className="w-3.5 h-3.5" /> Rejected
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button 
                                            onClick={() => window.open(payment.screenshotUrl, '_blank')}
                                            className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="View Screenshot"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>

                                        {(payment.verificationStatus === 'failed_verification' || payment.verificationStatus === 'pending') && (
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
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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
