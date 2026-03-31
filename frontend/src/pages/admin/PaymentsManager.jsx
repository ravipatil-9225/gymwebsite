import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { CheckCircle, XCircle, Clock, Banknote, CreditCard, Download, ZoomIn, X, Image as ImageIcon } from 'lucide-react';

const STATUS_LABELS = {
    auto_verified:       { label: 'Auto Verified',     bg: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
    manually_verified:   { label: 'Manually Verified', bg: 'bg-blue-100 text-blue-700 border-blue-200',      icon: <CheckCircle className="w-3.5 h-3.5" /> },
    cash_pending:        { label: 'Cash Pending',       bg: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Banknote className="w-3.5 h-3.5" /> },
    cash_collected:      { label: 'Cash Collected',     bg: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
    pending:             { label: 'Pending Review',     bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-3.5 h-3.5" /> },
    failed_verification: { label: 'Failed OCR',         bg: 'bg-red-100 text-red-700 border-red-200',         icon: <XCircle className="w-3.5 h-3.5" /> },
    rejected:            { label: 'Rejected',           bg: 'bg-gray-100 text-gray-700 border-gray-200',      icon: <XCircle className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_LABELS[status] || { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg}`}>
            {s.icon} {s.label}
        </span>
    );
};

/* ── Lightbox overlay ─────────────────────────────────────────── */
const Lightbox = ({ payment, onClose }) => {
    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = payment.screenshot?.url || '';
        a.download = `payment_${payment.transactionId || payment._id}.jpg`;
        a.click();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div>
                        <p className="font-semibold text-gray-800 text-sm">{payment.userName}</p>
                        <p className="text-xs text-gray-400">{payment.planName} · ₹{payment.planPrice}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            title="Download Screenshot"
                        >
                            <Download className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Screenshot */}
                <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[300px]">
                    <img
                        src={payment.screenshot?.url}
                        alt="Payment Screenshot"
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                    />
                </div>

                {/* Transaction Info */}
                <div className="px-5 py-3 border-t border-gray-100 bg-white flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>
                        <span className="font-semibold text-gray-700">Txn ID: </span>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded select-all">{payment.transactionId}</code>
                    </span>
                    {payment.ocrConfidence && (
                        <span>
                            <span className="font-semibold text-gray-700">OCR Confidence: </span>
                            {payment.ocrConfidence.toFixed(1)}%
                        </span>
                    )}
                    <span>
                        <span className="font-semibold text-gray-700">Status: </span>
                        <StatusBadge status={payment.verificationStatus} />
                    </span>
                </div>
            </div>
        </div>
    );
};

/* ── Screenshot Thumbnail ─────────────────────────────────────── */
const ScreenshotThumb = ({ payment, onExpand }) => {
    const handleDownload = (e) => {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = payment.screenshot?.url || '';
        a.download = `payment_${payment.transactionId || payment._id}.jpg`;
        a.click();
    };

    return (
        <div className="mt-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Payment Screenshot
            </p>
            <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer bg-gray-50"
                 onClick={onExpand}>
                <img
                    src={payment.screenshot?.url}
                    alt="Payment proof"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                </div>
            </div>
            {/* Download link below thumbnail */}
            <button
                onClick={handleDownload}
                className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
                title="Download Screenshot"
            >
                <Download className="w-3 h-3" /> Download
            </button>
        </div>
    );
};

/* ── Payment Row Component ─────────────────────────────────────────── */
const PaymentRow = ({ payment, updateStatus, applyDiscount, deletePayment, setLightbox }) => {
    const isCash = payment.paymentMethod === 'cash_on_bench';
    const [discVal, setDiscVal] = useState(payment.discount || '');
    const [discType, setDiscType] = useState(payment.discountType || 'flat');
    const isVerified = ['auto_verified', 'manually_verified', 'cash_collected'].includes(payment.verificationStatus);

    return (
        <tr className="hover:bg-gray-50 transition-colors align-top">
            {/* User */}
            <td className="px-5 py-4">
                <div className="font-medium text-gray-900 whitespace-nowrap">{payment.userName}</div>
                <div className="text-xs text-gray-500">{payment.email}</div>
                <div className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                    {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}
                </div>
            </td>

            {/* Plan */}
            <td className="px-5 py-4 whitespace-nowrap">
                <div className="text-gray-900 font-medium">{payment.planName}</div>
                <div className="text-gray-500 text-xs">₹{payment.planPrice}</div>
            </td>

            {/* Method badge */}
            <td className="px-5 py-4 whitespace-nowrap">
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

            {/* Transaction / Notes */}
            <td className="px-5 py-4 max-w-[220px]">
                {isCash ? (
                    <span className="text-gray-400 text-xs italic">Pay at reception</span>
                ) : (
                    <>
                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs select-all block mb-1 truncate max-w-[200px]">
                            {payment.transactionId}
                        </code>
                        {payment.extractedTransactionId && (
                            <code className={`px-2 py-1 rounded text-xs select-all block mb-1 truncate max-w-[200px] ${payment.extractedTransactionId === payment.transactionId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                OCR: {payment.extractedTransactionId}
                            </code>
                        )}
                        {payment.ocrConfidence && (
                            <div className="text-xs text-gray-400 mt-0.5">Conf: {payment.ocrConfidence.toFixed(1)}%</div>
                        )}
                    </>
                )}
            </td>

            {/* ── Screenshot column (UPI only) ── */}
            <td className="px-5 py-4">
                {!isCash && (payment.screenshot?.url || payment.screenshotUrl) ? (
                    <ScreenshotThumb
                        payment={{...payment, screenshotUrl: payment.screenshot?.url || payment.screenshotUrl}}
                        onExpand={() => setLightbox({...payment, screenshotUrl: payment.screenshot?.url || payment.screenshotUrl})}
                    />
                ) : (
                    <span className="text-gray-300 text-xs">—</span>
                )}
            </td>

            {/* Status */}
            <td className="px-5 py-4 whitespace-nowrap">
                <StatusBadge status={payment.verificationStatus} />
            </td>

            {/* Discount */}
            <td className="px-5 py-4">
                <div className="flex flex-col gap-2">
                    {payment.finalAmount !== undefined ? (
                        <div className="text-xs">
                            <div className="line-through text-gray-400">₹{payment.originalAmount}</div>
                            <div className="text-red-500 font-semibold mb-1">
                                -{payment.discountType === 'percentage' ? `${payment.discount}%` : `₹${payment.discount}`}
                            </div>
                            <div className="text-green-600 font-bold">Final: ₹{payment.finalAmount}</div>
                        </div>
                    ) : <span className="text-xs text-gray-500">₹{payment.planPrice}</span>}
                    
                    {!isVerified && (
                        <div className="flex flex-col gap-1 mt-2">
                            <div className="flex gap-1">
                                <input type="number" value={discVal} onChange={e => setDiscVal(e.target.value)} placeholder="0" className="w-16 px-2 py-1 border text-xs rounded" />
                                <select value={discType} onChange={e => setDiscType(e.target.value)} className="w-[70px] px-1 py-1 border text-xs rounded">
                                    <option value="flat">₹</option>
                                    <option value="percentage">%</option>
                                </select>
                            </div>
                            <button onClick={() => applyDiscount(payment._id, discVal, discType)} className="w-full bg-blue-600 text-white text-[10px] py-1 rounded hover:bg-blue-700">Apply</button>
                        </div>
                    )}
                </div>
            </td>

            {/* Actions */}
            <td className="px-5 py-4 text-right whitespace-nowrap space-x-1">
                {/* Cash payment actions */}
                {isCash && payment.verificationStatus === 'cash_pending' && (
                    <button
                        onClick={() => updateStatus(payment._id, 'cash_collected')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 font-medium"
                        title="Mark Cash Collected"
                    >
                        <CheckCircle className="w-3.5 h-3.5" /> Collected
                    </button>
                )}

                {/* UPI failed/pending actions */}
                {!isCash && (payment.verificationStatus === 'failed_verification' || payment.verificationStatus === 'pending') && (
                    <button
                        onClick={() => updateStatus(payment._id, 'manually_verified')}
                        className="inline-flex items-center justify-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                        title="Approve Manually"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                )}

                {/* Reject/Delete (Shared) */}
                {['pending', 'cash_pending', 'failed_verification'].includes(payment.verificationStatus) && (
                    <button
                        onClick={() => updateStatus(payment._id, 'rejected')}
                        className="inline-flex items-center justify-center p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-200"
                        title="Reject"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
                
                <button
                    onClick={() => deletePayment(payment._id)}
                    className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    title="Delete Record"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

/* ── Main Component ─────────────────────────────────────────── */
const PaymentsManager = () => {
    const [payments, setPayments]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [tab, setTab]               = useState('all');
    const [lightbox, setLightbox]     = useState(null); // payment object or null

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

    const applyDiscount = async (id, discount, type) => {
        try {
            const token = localStorage.getItem('gymToken');
            await axios.put(`/api/admin/payments/${id}/apply-discount`, { discount: Number(discount), discountType: type }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Discount applied successfully!');
            fetchPayments();
        } catch (err) {
            alert(err.response?.data?.message || 'Error applying discount');
            console.error(err);
        }
    };

    const deletePayment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment record and its screenshot?')) return;
        try {
            const token = localStorage.getItem('gymToken');
            await axios.delete(`/api/admin/payments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPayments();
        } catch (err) {
            alert('Error deleting payment');
            console.error(err);
        }
    };

    const filtered = payments.filter(p => {
        if (tab === 'upi')  return p.paymentMethod !== 'cash_on_bench';
        if (tab === 'cash') return p.paymentMethod === 'cash_on_bench';
        return true;
    });

    const cashPendingCount = payments.filter(p => p.verificationStatus === 'cash_pending').length;
    const upiPendingCount  = payments.filter(p => p.verificationStatus === 'pending' || p.verificationStatus === 'failed_verification').length;

    if (loading) return <div className="p-8 text-gray-500">Loading payments...</div>;

    return (
        <div className="space-y-6">
            {/* Lightbox */}
            {lightbox && <Lightbox payment={lightbox} onClose={() => setLightbox(null)} />}

            {/* Header */}
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
                    { key: 'upi',  label: 'UPI / Online',  icon: <CreditCard className="w-3.5 h-3.5" /> },
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
                            {t.key === 'all'  ? payments.length
                            : t.key === 'cash' ? payments.filter(p => p.paymentMethod === 'cash_on_bench').length
                            :                    payments.filter(p => p.paymentMethod !== 'cash_on_bench').length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium whitespace-nowrap">
                            <tr>
                                <th className="px-5 py-4">User</th>
                                <th className="px-5 py-4">Plan</th>
                                <th className="px-5 py-4">Method</th>
                                <th className="px-5 py-4">Transaction / Notes</th>
                                <th className="px-5 py-4">Screenshot</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 w-48">Discount</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filtered.map(payment => (
                                <PaymentRow 
                                    key={payment._id} 
                                    payment={payment} 
                                    updateStatus={updateStatus} 
                                    deletePayment={deletePayment} 
                                    applyDiscount={applyDiscount} 
                                    setLightbox={setLightbox} 
                                />
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
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
