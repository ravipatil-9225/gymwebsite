import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Activity, CalendarDays, TrendingUp, X, Download, Printer, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import socket from '../utils/socket';
import { AuthContext } from '../context/AuthContext';
import SubscriptionCard from '../components/dashboard/SubscriptionCard';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, logout, token } = useContext(AuthContext);
    const userName = user?.name || 'Member';

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [payments, setPayments] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchHistory = async () => {
        if (!token) return;
        setHistoryLoading(true);
        try {
            const res = await axios.get('/api/payments/my-payments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(res.data);
        } catch (err) {
            console.error('Error fetching payment history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchHistorySilent = async () => {
        if (!token) return;
        try {
            const res = await axios.get('/api/payments/my-payments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayments(res.data);
        } catch (err) {
            console.error('Error silently refreshing payment history:', err);
        }
    };

    useEffect(() => {
        if (!token) return;
        const handleDbChange = () => {
            fetchHistorySilent();
        };
        socket.on('db_changed', handleDbChange);
        return () => {
            socket.off('db_changed', handleDbChange);
        };
    }, [token]);

    const downloadReceipt = (payment) => {
        const formattedDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const startDateStr = payment.startDate ? new Date(payment.startDate).toLocaleDateString('en-IN') : 'N/A';
        const endDateStr = payment.expiryDate ? new Date(payment.expiryDate).toLocaleDateString('en-IN') : 'N/A';

        // Create a temporary container styled for PDF generation
        const element = document.createElement('div');
        element.style.padding = '30px';
        element.style.background = '#ffffff';
        element.style.fontFamily = "'Inter', Arial, sans-serif";
        
        element.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 40px; border-radius: 12px; background: #ffffff;">
                <table style="width: 100%; border-bottom: 2px solid #E34A29; padding-bottom: 20px; margin-bottom: 30px; border-collapse: collapse;">
                    <tr>
                        <td style="vertical-align: middle; padding: 0;">
                            <h1 style="font-size: 24px; font-weight: 800; color: #111; margin: 0; letter-spacing: 0.05em; text-transform: uppercase; font-family: 'Inter', Arial, sans-serif;">
                                TARA <span style="color: #E34A29;">FITNESS</span>
                            </h1>
                            <p style="font-size: 11px; color: #666; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em; font-family: 'Inter', Arial, sans-serif;">
                                Strength & Conditioning Centre
                            </p>
                        </td>
                        <td style="vertical-align: middle; text-align: right; padding: 0;">
                            <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: #E34A29; font-family: 'Inter', Arial, sans-serif;">RECEIPT</h2>
                            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0; font-family: 'Inter', Arial, sans-serif;">ID: ${payment._id}</p>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; margin-bottom: 40px; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; vertical-align: top; padding: 0;">
                            <h3 style="font-size: 12px; color: #888; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Inter', Arial, sans-serif;">Billed To</h3>
                            <p style="font-size: 14px; margin: 0 0 5px 0; color: #333; font-weight: 700; font-family: 'Inter', Arial, sans-serif;">${payment.userName}</p>
                            <p style="font-size: 13px; margin: 0; color: #666; font-family: 'Inter', Arial, sans-serif;">${payment.email}</p>
                        </td>
                        <td style="width: 50%; vertical-align: top; text-align: right; padding: 0;">
                            <h3 style="font-size: 12px; color: #888; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Inter', Arial, sans-serif;">Receipt Info</h3>
                            <p style="font-size: 13px; margin: 0 0 5px 0; color: #333; font-family: 'Inter', Arial, sans-serif;">Date: ${formattedDate}</p>
                            <p style="font-size: 13px; margin: 0 0 5px 0; color: #333; font-family: 'Inter', Arial, sans-serif;">Method: <span style="text-transform: uppercase;">${payment.paymentMethod || 'UPI'}</span></p>
                            ${payment.transactionId ? `<p style="font-size: 13px; margin: 0; color: #333; font-family: 'Inter', Arial, sans-serif;">Txn ID: ${payment.transactionId}</p>` : ''}
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                    <thead>
                        <tr>
                            <th style="text-align: left; font-size: 12px; color: #888; text-transform: uppercase; border-bottom: 1px solid #eaeaea; padding-bottom: 12px; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">Description</th>
                            <th style="text-align: left; font-size: 12px; color: #888; text-transform: uppercase; border-bottom: 1px solid #eaeaea; padding-bottom: 12px; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">Duration</th>
                            <th style="text-align: right; font-size: 12px; color: #888; text-transform: uppercase; border-bottom: 1px solid #eaeaea; padding-bottom: 12px; font-weight: 600; font-family: 'Inter', Arial, sans-serif;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 16px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; font-family: 'Inter', Arial, sans-serif;">
                                <span style="font-weight: 600; color: #111;">${payment.planName}</span>
                                <div style="font-size: 11px; color: #888; margin-top: 4px;">
                                    Validity: ${startDateStr} to ${endDateStr}
                                </div>
                            </td>
                            <td style="padding: 16px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; color: #333; font-family: 'Inter', Arial, sans-serif;">
                                ${payment.startDate && payment.expiryDate ? Math.ceil((new Date(payment.expiryDate) - new Date(payment.startDate)) / (1000 * 60 * 60 * 24)) + ' Days' : '—'}
                            </td>
                            <td style="padding: 16px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; text-align: right; font-weight: 600; color: #111; font-family: 'Inter', Arial, sans-serif;">
                                ₹${payment.planPrice}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr>
                        <td style="width: 50%; border: none;"></td>
                        <td style="width: 50%; border: none;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="font-size: 14px; padding: 8px 0; color: #555; font-family: 'Inter', Arial, sans-serif;">Subtotal</td>
                                    <td style="font-size: 14px; padding: 8px 0; color: #555; text-align: right; font-family: 'Inter', Arial, sans-serif;">₹${payment.planPrice}</td>
                                </tr>
                                <tr style="border-top: 1px solid #eaeaea;">
                                    <td style="font-size: 18px; font-weight: 700; color: #E34A29; padding: 15px 0 8px 0; font-family: 'Inter', Arial, sans-serif;">Paid Total</td>
                                    <td style="font-size: 18px; font-weight: 700; color: #E34A29; padding: 15px 0 8px 0; text-align: right; font-family: 'Inter', Arial, sans-serif;">₹${payment.planPrice}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 50px; border-top: 1px solid #f5f5f5; padding-top: 20px; text-align: center; font-size: 11px; color: #888; font-family: 'Inter', Arial, sans-serif;">
                    <p style="margin: 5px 0;">Thank you for training with us! Keep crushing your goals.</p>
                    <p style="margin: 5px 0;">Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur, Maharashtra 416007</p>
                </div>
            </div>
        `;

        const opt = {
            margin: [10, 10],
            filename: `Receipt_${payment._id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const printReceipt = (payment) => {
        const printWindow = window.open('', '_blank');
        const formattedDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const startDateStr = payment.startDate ? new Date(payment.startDate).toLocaleDateString('en-IN') : 'N/A';
        const endDateStr = payment.expiryDate ? new Date(payment.expiryDate).toLocaleDateString('en-IN') : 'N/A';

        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - Tara Fitness Centre</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        color: #111;
                        margin: 0;
                        padding: 40px;
                        background-color: #fff;
                    }
                    .receipt-container {
                        max-width: 650px;
                        margin: 0 auto;
                        border: 1px solid #eaeaea;
                        padding: 40px;
                        border-radius: 12px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #E34A29;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo-section h1 {
                        font-size: 24px;
                        font-weight: 800;
                        color: #111;
                        margin: 0;
                        letter-spacing: 0.05em;
                    }
                    .logo-section span {
                        color: #E34A29;
                    }
                    .logo-section p {
                        font-size: 11px;
                        color: #666;
                        margin: 5px 0 0 0;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                    }
                    .receipt-title {
                        text-align: right;
                    }
                    .receipt-title h2 {
                        font-size: 20px;
                        font-weight: 700;
                        margin: 0;
                        color: #E34A29;
                    }
                    .receipt-title p {
                        font-size: 12px;
                        color: #666;
                        margin: 5px 0 0 0;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-cols: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 40px;
                    }
                    .details-block h3 {
                        font-size: 12px;
                        color: #888;
                        margin: 0 0 10px 0;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .details-block p {
                        font-size: 14px;
                        margin: 0 0 5px 0;
                        color: #333;
                        font-weight: 500;
                    }
                    .details-block .highlight {
                        font-weight: 700;
                        color: #111;
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 40px;
                    }
                    .table th {
                        text-align: left;
                        font-size: 12px;
                        color: #888;
                        text-transform: uppercase;
                        border-bottom: 1px solid #eaeaea;
                        padding-bottom: 12px;
                        font-weight: 600;
                    }
                    .table td {
                        padding: 16px 0;
                        font-size: 14px;
                        border-bottom: 1px solid #f5f5f5;
                    }
                    .table .item-name {
                        font-weight: 600;
                        color: #111;
                    }
                    .summary {
                        display: flex;
                        justify-content: flex-end;
                    }
                    .summary-table {
                        width: 250px;
                    }
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 14px;
                        padding: 8px 0;
                        color: #555;
                    }
                    .summary-row.total {
                        border-top: 1px solid #eaeaea;
                        margin-top: 10px;
                        padding-top: 15px;
                        font-size: 18px;
                        font-weight: 700;
                        color: #E34A29;
                    }
                    .footer {
                        margin-top: 50px;
                        border-top: 1px solid #f5f5f5;
                        padding-top: 20px;
                        text-align: center;
                        font-size: 11px;
                        color: #888;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .receipt-container {
                            border: none;
                            max-width: 100%;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <div class="logo-section">
                            <h1>TARA <span>FITNESS</span></h1>
                            <p>Strength & Conditioning Centre</p>
                        </div>
                        <div class="receipt-title">
                            <h2>RECEIPT</h2>
                            <p>ID: ${payment._id}</p>
                        </div>
                    </div>

                    <div class="details-grid">
                        <div class="details-block">
                            <h3>Billed To</h3>
                            <p class="highlight">${payment.userName}</p>
                            <p>${payment.email}</p>
                        </div>
                        <div class="details-block" style="text-align: right;">
                            <h3>Receipt Info</h3>
                            <p>Date: ${formattedDate}</p>
                            <p>Method: <span style="text-transform: uppercase;">${payment.paymentMethod || 'UPI'}</span></p>
                            ${payment.transactionId ? `<p>Txn ID: ${payment.transactionId}</p>` : ''}
                        </div>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Duration</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="item-name">${payment.planName}</span>
                                    <div style="font-size: 11px; color: #888; margin-top: 4px;">
                                        Validity: ${startDateStr} to ${endDateStr}
                                    </div>
                                </td>
                                <td>${payment.startDate && payment.expiryDate ? Math.ceil((new Date(payment.expiryDate) - new Date(payment.startDate)) / (1000 * 60 * 60 * 24)) + ' Days' : '—'}</td>
                                <td style="text-align: right; font-weight: 600;">₹${payment.planPrice}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="summary">
                        <div class="summary-table">
                            <div class="summary-row">
                                <span>Subtotal</span>
                                <span>₹${payment.planPrice}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Paid Total</span>
                                <span>₹${payment.planPrice}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for training with us! Keep crushing your goals.</p>
                        <p>Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur, Maharashtra 416007</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
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
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 overflow-hidden shadow-lg shadow-primary/10">
                                    {user?.profileImage?.url ? (
                                        <img 
                                            src={user.profileImage.url} 
                                            alt={userName} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-white capitalize">{userName}</h2>
                                    <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 mt-1">
                                        Active Member
                                    </span>
                                </div>
                            </div>

                            <SubscriptionCard />
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-display font-bold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10">
                                    <span className="text-white">Book a Class</span>
                                    <CalendarDays className="w-5 h-5 text-gray-400" />
                                </button>
                                <button 
                                    onClick={() => { setIsHistoryOpen(true); fetchHistory(); }}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10"
                                >
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

            {/* History Modal */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b0b0b] border border-white/10 rounded-2xl max-w-4xl w-full p-6 md:p-8 relative overflow-hidden shadow-2xl"
                        >
                            <button
                                onClick={() => setIsHistoryOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-white text-2xl font-display font-bold mb-6 tracking-wide uppercase">
                                Payment History
                            </h2>

                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-gray-400 text-sm">Fetching transaction history...</p>
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    No payment transactions found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-400">
                                        <thead className="text-[10px] tracking-wider uppercase text-gray-500 border-b border-white/10">
                                            <tr>
                                                <th className="pb-3 font-semibold">Date</th>
                                                <th className="pb-3 font-semibold">Plan</th>
                                                <th className="pb-3 font-semibold">Amount</th>
                                                <th className="pb-3 font-semibold">Method</th>
                                                <th className="pb-3 font-semibold">Status</th>
                                                <th className="pb-3 font-semibold text-right">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {payments.map((payment) => {
                                                const isVerified = ['auto_verified', 'manually_verified', 'cash_collected'].includes(payment.verificationStatus);
                                                return (
                                                    <tr key={payment._id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-4">
                                                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="py-4 font-semibold text-white">{payment.planName}</td>
                                                        <td className="py-4 text-white">₹{payment.planPrice}</td>
                                                        <td className="py-4 uppercase text-xs">{payment.paymentMethod}</td>
                                                        <td className="py-4">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                                isVerified
                                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                    : payment.verificationStatus === 'failed_verification'
                                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                            }`}>
                                                                {payment.verificationStatus.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className="flex justify-end items-center gap-2">
                                                                {isVerified ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => downloadReceipt(payment)}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
                                                                            title="Download PDF"
                                                                        >
                                                                            <Download className="w-3.5 h-3.5" />
                                                                            Download
                                                                        </button>
                                                                        <button
                                                                            onClick={() => printReceipt(payment)}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
                                                                            title="Print Receipt"
                                                                        >
                                                                            <Printer className="w-3.5 h-3.5" />
                                                                            Print
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-gray-600 text-xs italic">Not Available</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDashboard;

