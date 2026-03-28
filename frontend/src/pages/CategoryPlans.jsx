import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Dumbbell, Activity, Target, Zap, Shield, Crown, X, Loader, CheckCircle, Mail, User, Image as ImageIcon, Hash, AlertTriangle, Banknote, CreditCard, Clock, Flame, Copy, CheckCheck, Package } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import socket from '../utils/socket';
import { AuthContext } from '../context/AuthContext';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

// Strip commas from price string -> plain number string for UPI
function rawPrice(priceStr) {
    return String(priceStr).replace(/,/g, '');
}

const CategoryPlans = () => {
    const { categoryName } = useParams();
    const { user } = useContext(AuthContext);
    const [selected, setSelected] = useState(null);
    const [payTab, setPayTab] = useState('upi'); // 'upi' | 'cash'
    const [form, setForm] = useState({ name: '', email: '', transactionId: '', screenshotUrl: '' });
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error
    const [errMsg, setErrMsg] = useState('');
    const [verifyMsg, setVerifyMsg] = useState('');
    const [verifyStatus, setVerifyStatus] = useState('');
    const [upiCopied, setUpiCopied] = useState(false);
    const [groupedPlans, setGroupedPlans] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async (isSilent = false) => {
            try {
                const { data } = await axios.get('/api/public/packages');
                const styles = [
                    { icon: <Target size={28} className="text-[#FFD700]" />, color: '#FFD700', popular: true, bestValue: false, trialTag: false, gradient: 'from-[#FFD700]/15 to-transparent', border: 'border-[#FFD700]/40 hover:border-[#FFD700]/70', badgeBg: 'bg-[#FFD700] text-black' },
                    { icon: <Crown size={28} className="text-[#a78bfa]" />, color: '#a78bfa', popular: false, bestValue: true, trialTag: false, gradient: 'from-[#a78bfa]/15 to-transparent', border: 'border-[#a78bfa]/40 hover:border-[#a78bfa]/70', badgeBg: 'bg-[#a78bfa]' },
                    { icon: <Dumbbell size={28} className="text-[#CD7F32]" />, color: '#CD7F32', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#CD7F32]/15 to-transparent', border: 'hover:border-[#CD7F32]/50', badgeBg: 'bg-[#CD7F32]' },
                    { icon: <Flame size={28} className="text-[#ff4b2b]" />, color: '#ff4b2b', popular: false, bestValue: false, trialTag: true, gradient: 'from-[#ff4b2b]/15 to-transparent', border: 'hover:border-[#ff4b2b]/50', badgeBg: 'bg-gradient-to-r from-[#ff4b2b] to-[#ff9068] text-white' },
                    { icon: <Shield size={28} className="text-[#4299e1]" />, color: '#4299e1', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#4299e1]/15 to-transparent', border: 'hover:border-[#4299e1]/50', badgeBg: 'bg-[#4299e1]' },
                    { icon: <Zap size={28} className="text-[#ed8936]" />, color: '#ed8936', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#ed8936]/15 to-transparent', border: 'hover:border-[#ed8936]/50', badgeBg: 'bg-[#ed8936]' },
                    { icon: <Activity size={28} className="text-[#9e9e9e]" />, color: '#9e9e9e', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#9e9e9e]/15 to-transparent', border: 'hover:border-[#9e9e9e]/50', badgeBg: 'bg-[#9e9e9e]' },
                ];
                const mapped = data.filter(p => p.isActive && p.category === categoryName).map((p, idx) => {
                    const st = styles[idx % styles.length];
                    return {
                        id: p._id, name: p.name, price: p.price.toString(), duration: p.duration, description: p.description,
                        includes: p.features || [], icon: st.icon, accentColor: st.color, popular: st.popular, bestValue: st.bestValue, trialTag: st.trialTag,
                        gradient: st.gradient, border: st.border, badgeBg: st.badgeBg, category: p.category || 'OTHER PACKAGES'
                    };
                });
                const grouped = mapped.reduce((acc, plan) => {
                    const dur = plan.duration || 'Other';
                    if (!acc[dur]) acc[dur] = [];
                    acc[dur].push(plan);
                    return acc;
                }, {});
                setGroupedPlans(grouped);
            } catch (err) { console.error(err); } finally { if (!isSilent) setLoading(false); }
        };
        fetchPlans();
        const silentFetch = () => fetchPlans(true);
        socket.on('db_changed', silentFetch);
        return () => socket.off('db_changed', silentFetch);
    }, []);


    const UPI_ID = 'uddhavb9561-1@okaxis';

    const copyUpiId = () => {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            setUpiCopied(true);
            setTimeout(() => setUpiCopied(false), 2500);
        });
    };

    const openModal = (plan) => {
        setSelected(plan);
        setPayTab('upi');
        setForm({ name: user?.name || '', email: user?.email || '', transactionId: '', screenshotUrl: '' });
        setStatus('idle');
        setErrMsg('');
        setVerifyMsg('');
        setVerifyStatus('');
    };

    const closeModal = () => { setSelected(null); setStatus('idle'); };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(f => ({ ...f, screenshotUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.email) {
            setErrMsg('Please enter your name and email.');
            setStatus('error');
            return;
        }

        if (payTab === 'upi' && (!form.screenshotUrl || !form.transactionId)) {
            setErrMsg('Please enter Transaction ID and upload payment screenshot.');
            setStatus('error');
            return;
        }

        setStatus('submitting');
        try {
            const payload = {
                userName: form.name,
                email: form.email,
                planName: selected.name,
                planPrice: selected.price,
                paymentMethod: payTab === 'cash' ? 'cash_on_bench' : 'upi',
                ...(payTab === 'upi' && {
                    transactionId: form.transactionId,
                    screenshotUrl: form.screenshotUrl,
                }),
            };

            const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Submission Failed');

            setVerifyMsg(data.message);
            setVerifyStatus(data.payment?.verificationStatus || '');
            setStatus('success');
        } catch (err) {
            setErrMsg(err.message);
            setStatus('error');
        }
    };

    const getSuccessIcon = () => {
        if (verifyStatus === 'auto_verified') return <CheckCircle className="w-8 h-8 text-green-400" />;
        if (verifyStatus === 'cash_pending') return <Clock className="w-8 h-8 text-orange-400" />;
        return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
    };

    const getSuccessBg = () => {
        if (verifyStatus === 'auto_verified') return 'bg-green-500/20';
        if (verifyStatus === 'cash_pending') return 'bg-orange-500/20';
        return 'bg-yellow-500/20';
    };

    const getSuccessDesc = () => {
        if (verifyStatus === 'auto_verified') return 'Your payment was automatically verified. We will confirm your membership shortly.';
        if (verifyStatus === 'cash_pending') return 'Your cash payment request has been recorded. Please pay ₹' + selected?.price + ' at the gym reception. Your membership will be activated once the payment is received.';
        return 'Our team will manually review your transaction screenshot. We\'ll update you as soon as possible.';
    };

    return (
        <section className="py-24 bg-dark min-h-[calc(100vh-80px)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 mt-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-primary tracking-[0.2em] font-sans font-semibold text-sm mb-3 uppercase"
                    >
                        Pricing
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-5xl lg:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        {categoryName} <span className="text-primary font-light">Plans</span>
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }} animate={{ width: '96px' }} transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    />
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-gray-400 mt-6 max-w-xl mx-auto font-sans text-base"
                    >
                        Choose the plan that fits your goals. All plans include full access to our state-of-the-art facility.
                    </motion.p>
                </div>

                {/* Plans Grid grouped by duration */}
                <div className="space-y-16">
                    {Object.keys(groupedPlans).length === 0 && !loading ? (
                        <div className="text-center text-gray-500 py-10">No plans found in this category.</div>
                    ) : (
                        ['1 Day', '1 Month', '3 Months', '6 Months', '1 Year', 'Other'].map((durationSection) => {
                            const plans = groupedPlans[durationSection];
                            if (!plans || plans.length === 0) return null;

                            const sectionTitle = {
                                '1 Day': 'Daily Plans',
                                '1 Month': 'Monthly Plans',
                                '3 Months': '3 Months Plans',
                                '6 Months': '6 Months Plans',
                                '1 Year': 'Yearly Plans',
                                'Other': 'Other Plans'
                            }[durationSection];

                            return (
                                <div key={durationSection}>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h3 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wide">
                                            {sectionTitle}
                                        </h3>
                                        <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                                    </div>
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
                                    >
                                        {plans.map((plan, index) => (
                                            <motion.div
                                                key={index}
                                                variants={itemVariants}
                                                className={`relative bg-dark-card border ${plan.popular || plan.bestValue || plan.trialTag ? plan.border : `border-white/5 ${plan.border}`} rounded-2xl p-8 transition-all duration-500 group overflow-hidden shadow-xl flex flex-col`}
                                                style={plan.popular || plan.bestValue || plan.trialTag ? { boxShadow: `0 0 40px ${plan.accentColor}18` } : {}}
                                            >
                                                {/* Hover gradient */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                                {/* Badge */}
                                                {(plan.popular || plan.bestValue || plan.trialTag) && (
                                                    <div className={`absolute top-0 right-0 ${plan.badgeBg} text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest`}>
                                                        {plan.popular ? 'Most Popular' : plan.bestValue ? 'Best Value' : 'Trial Access'}
                                                    </div>
                                                )}

                                                <div className="relative z-10 flex flex-col h-full">
                                                    {/* Icon */}
                                                    <div
                                                        className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-inner"
                                                        style={{ borderColor: `${plan.accentColor}30` }}
                                                    >
                                                        {plan.icon}
                                                    </div>

                                                    {/* Name & Price */}
                                                    <h3 className="text-white font-display text-2xl font-bold mb-1 group-hover:text-primary transition-colors duration-300 leading-tight">
                                                        {plan.name}
                                                    </h3>

                                                    <div className="flex items-baseline gap-1 mb-4">
                                                        <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                                                        <span className="text-gray-400 text-sm font-sans">{plan.duration}</span>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="w-full h-px bg-white/10 mb-5 group-hover:bg-primary/20 transition-colors" />

                                                    {/* Description */}
                                                    <p className="text-gray-400 font-sans text-sm leading-relaxed mb-5 group-hover:text-gray-300 transition-colors">
                                                        {plan.description}
                                                    </p>

                                                    {/* Includes */}
                                                    <div className="mb-6 flex-grow">
                                                        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Includes:</p>
                                                        <ul className="space-y-2.5">
                                                            {plan.includes.map((item, idx) => (
                                                                <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm group-hover:text-white transition-colors font-sans">
                                                                    <div className="mt-0.5 rounded-full p-0.5 shrink-0" style={{ background: `${plan.accentColor}30` }}>
                                                                        <Check size={11} style={{ color: plan.accentColor }} />
                                                                    </div>
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* CTA */}
                                                    <button
                                                        onClick={() => openModal(plan)}
                                                        className="block w-full py-3.5 px-6 rounded-xl text-center text-white font-semibold font-sans text-sm tracking-wider transition-all duration-300 border border-white/10 bg-white/5 hover:border-none mt-auto cursor-pointer"
                                                        onMouseEnter={e => { e.currentTarget.style.background = plan.accentColor; e.currentTarget.style.boxShadow = `0 0 20px ${plan.accentColor}55`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.boxShadow = ''; }}
                                                    >
                                                        Get Started
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="text-center text-gray-500 font-sans text-sm mt-14"
                >
                    All memberships include access to our full facility. For more enquiries, <Link to="/forms/enquiry" className="text-primary hover:underline">contact us</Link>.
                </motion.p>
            </div>

            {/* ── PLAN INTEREST MODAL ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && closeModal()}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-dark-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-y-auto max-h-[90vh]"
                        >
                            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"><X size={20} /></button>

                            {status === 'success' ? (
                                <div className="text-center py-4">
                                    <div className={`w-16 h-16 ${getSuccessBg()} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                        {getSuccessIcon()}
                                    </div>
                                    <h3 className="text-xl font-display font-bold text-white mb-2">{verifyMsg}</h3>
                                    <p className="text-gray-400 text-sm">{getSuccessDesc()}</p>
                                    <button onClick={closeModal} className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-white font-semibold text-sm transition-colors">Done</button>
                                </div>
                            ) : (
                                <>
                                    {/* Plan Header */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">{selected.icon}</div>
                                        <div>
                                            <h3 className="text-lg font-display font-bold text-white">{selected.name}</h3>
                                            <p className="text-sm font-sans" style={{ color: selected.accentColor }}>₹{selected.price} {selected.duration}</p>
                                        </div>
                                    </div>

                                    {/* Payment Method Tabs */}
                                    <div className="flex gap-2 mb-5 bg-white/5 rounded-xl p-1">
                                        <button
                                            onClick={() => { setPayTab('upi'); setStatus('idle'); setErrMsg(''); }}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${payTab === 'upi' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <CreditCard size={15} /> UPI / QR Pay
                                        </button>
                                        <button
                                            onClick={() => { setPayTab('cash'); setStatus('idle'); setErrMsg(''); }}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${payTab === 'cash' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Banknote size={15} /> Cash on Bench
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Common Fields */}
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input required type="text" placeholder="Your full name *" value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm" />
                                        </div>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input required type="email" placeholder="Your email address *" value={form.email}
                                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm" />
                                        </div>

                                        {/* ── UPI TAB CONTENT ── */}
                                        {payTab === 'upi' && (
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">

                                                {/* Step 1: QR + UPI Info */}
                                                <div className="flex flex-col items-center">
                                                    <p className="text-sm font-semibold text-white mb-1">Step 1: Pay ₹{selected.price} via UPI</p>
                                                    <p className="text-xs text-gray-400 mb-3 text-center">Scan QR below with your phone camera, or open your UPI app and send to the UPI ID</p>

                                                    {/* QR Code */}
                                                    <div className="bg-white p-2 rounded-lg mb-3 flex items-center justify-center h-52 w-52 shadow-xl border border-gray-200">
                                                        <img src="/qr.jpeg" alt="UPI QR Code" className="w-full h-full object-contain" />
                                                    </div>

                                                    {/* Copyable UPI ID */}
                                                    <p className="text-xs text-gray-400 mb-1">UPI ID (tap to copy):</p>
                                                    <button
                                                        type="button"
                                                        onClick={copyUpiId}
                                                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-white font-mono text-sm transition-all duration-200 group"
                                                    >
                                                        <span>{UPI_ID}</span>
                                                        {upiCopied
                                                            ? <CheckCheck size={14} className="text-green-400" />
                                                            : <Copy size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                                                        }
                                                    </button>
                                                    {upiCopied && <p className="text-green-400 text-xs mt-1 font-semibold">✓ Copied to clipboard!</p>}

                                                    {/* UPI Deep-link Button */}
                                                    <a
                                                        href={`upi://pay?pa=${UPI_ID}&pn=Uddhav%20Borgalli&am=${rawPrice(selected.price)}&cu=INR&tn=Gym%20Membership%20${encodeURIComponent(selected.name)}`}
                                                        className="mt-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-all duration-200 w-full"
                                                        onClick={(e) => {
                                                            // On desktop browsers upi:// won't work; show a helpful message
                                                            if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                                                e.preventDefault();
                                                                copyUpiId();
                                                            }
                                                        }}
                                                    >
                                                        <CreditCard size={14} /> Open UPI App to Pay ₹{selected.price}
                                                    </a>
                                                    <p className="text-xs text-gray-500 text-center">Opens GPay / PhonePe / Paytm directly on mobile</p>
                                                </div>

                                                <hr className="border-white/10" />

                                                {/* Step 2: Upload proof */}
                                                <p className="text-xs font-semibold text-white">Step 2: After payment, fill in details below</p>
                                                <p className="text-xs text-gray-400 -mt-2">Enter the UPI Transaction ID from your payment success screen and upload a screenshot.</p>

                                                <div className="relative">
                                                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input required type="text" placeholder="UPI Transaction ID *" value={form.transactionId}
                                                        onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))}
                                                        className="w-full pl-10 pr-4 py-3 bg-dark border border-white/10 focus:border-primary rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm" />
                                                </div>

                                                <div className="relative flex items-center bg-dark border border-white/10 rounded-xl text-sm overflow-hidden">
                                                    <div className="px-3 bg-white/5 border-r border-white/10 flex items-center justify-center h-full py-3">
                                                        <ImageIcon size={16} className="text-gray-400" />
                                                    </div>
                                                    <input required type="file" accept="image/*" onChange={handlePhotoUpload}
                                                        className="w-full pl-3 pr-4 py-2 text-gray-400 focus:outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                                                </div>
                                            </div>
                                        )}

                                        {/* ── CASH ON BENCH TAB CONTENT ── */}
                                        {payTab === 'cash' && (
                                            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                                        <Banknote size={20} className="text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">Pay at the Gym</p>
                                                        <p className="text-gray-400 text-xs">No online payment required</p>
                                                    </div>
                                                </div>
                                                <ul className="space-y-2 text-sm text-gray-300 mb-4">
                                                    <li className="flex items-start gap-2.5">
                                                        <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                                                        Submit this form to register your interest.
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                                                        Visit the gym reception and pay <span className="text-white font-semibold ml-1">₹{selected.price}</span> in cash.
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                                                        Our staff will activate your membership on the spot.
                                                    </li>
                                                </ul>
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 text-center">
                                                    <p className="text-green-300 text-xs font-medium">Amount to pay at bench</p>
                                                    <p className="text-white text-2xl font-bold mt-0.5">₹{selected.price}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">{selected.duration}</p>
                                                </div>
                                            </div>
                                        )}

                                        {status === 'error' && <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{errMsg}</p>}

                                        <button type="submit" disabled={status === 'submitting'}
                                            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wider transition-all disabled:opacity-60 flex justify-center items-center ${payTab === 'cash' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                            style={payTab === 'upi' ? { background: selected.accentColor } : {}}
                                        >
                                            {status === 'submitting' ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader size={18} className="animate-spin" /> Processing...
                                                </span>
                                            ) : payTab === 'cash' ? (
                                                <span className="flex items-center gap-2"><Banknote size={18} /> Register Cash Payment</span>
                                            ) : (
                                                'Pay & Verify'
                                            )}
                                        </button>
                                        <p className="text-xs text-gray-500 text-center mt-1">
                                            {payTab === 'upi' ? 'Our AI agent automatically verifies your payment.' : 'Your membership will be activated after cash is paid at reception.'}
                                        </p>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default CategoryPlans;
