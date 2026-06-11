import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Dumbbell, Activity, Target, Zap, Shield, Crown, X, Loader, CheckCircle, Mail, User, Image as ImageIcon, Hash, AlertTriangle, Banknote, CreditCard, Clock, Flame, Copy, CheckCheck, Package, Lock } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
    const { user, adminUser, token, adminToken } = useContext(AuthContext);
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [payTab, setPayTab] = useState('upi'); // 'upi' | 'cash' | 'later'
    const [form, setForm] = useState({ name: '', email: '', transactionId: '', screenshotFile: null });
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error
    const [errMsg, setErrMsg] = useState('');
    const [verifyMsg, setVerifyMsg] = useState('');
    const [verifyStatus, setVerifyStatus] = useState('');
    const [upiCopied, setUpiCopied] = useState(false);
    const [groupedPlans, setGroupedPlans] = useState({});
    const [loading, setLoading] = useState(true);
    const [discountInfo, setDiscountInfo] = useState(null);

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
                const decodedCategory = decodeURIComponent(categoryName);
                const mapped = data.filter(p => p.isActive && p.category === decodedCategory).map((p, idx) => {
                    const st = styles[idx % styles.length];
                    return {
                        id: p._id, name: p.name, price: p.price.toString(), duration: p.duration, description: p.description,
                        includes: p.features || [], icon: st.icon, accentColor: st.color, popular: st.popular, bestValue: st.bestValue, trialTag: st.trialTag,
                        gradient: st.gradient, border: st.border, badgeBg: st.badgeBg, category: p.category || 'OTHER PACKAGES', allowPending: p.allowPending !== false
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


    const UPI_ID = 'taraparmar2-2@oksbi';

    const copyUpiId = () => {
        navigator.clipboard.writeText(UPI_ID).then(() => {
            setUpiCopied(true);
            setTimeout(() => setUpiCopied(false), 2500);
        });
    };

    const openModal = async (plan) => {
        if (!user && !adminUser) {
            alert('Please log in to purchase a membership plan.');
            navigate('/login');
            return;
        }
        setSelected(plan);
        setPayTab('upi');
        setForm({ name: (user?.name || adminUser?.name) || '', email: (user?.email || adminUser?.email) || '', transactionId: '', screenshotFile: null });
        setPreview(null);
        setStatus('idle');
        setErrMsg('');
        setVerifyMsg('');
        setVerifyStatus('');
        setDiscountInfo(null);
        
        try {
            const tk = token || adminToken || localStorage.getItem('gymToken') || localStorage.getItem('adminToken');
            const res = await axios.get(`/api/payments/check-discount?planName=${encodeURIComponent(plan.name)}`, {
                headers: { Authorization: `Bearer ${tk}` }
            });
            if (res.data.hasDiscount) {
                setDiscountInfo(res.data);
            }
        } catch(err) {
            console.error('Failed to check discount', err);
        }
    };

    const closeModal = () => { setSelected(null); setStatus('idle'); setDiscountInfo(null); };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(f => ({ ...f, screenshotFile: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
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

        if (payTab === 'upi' && (!form.screenshotFile || !form.transactionId)) {
            setErrMsg('Please enter Transaction ID and upload payment screenshot.');
            setStatus('error');
            return;
        }

        setStatus('submitting');
        try {
            let bodyData;
            let headers = {
                'Authorization': `Bearer ${token || adminToken || localStorage.getItem('gymToken') || localStorage.getItem('adminToken')}`
            };

            if (payTab === 'upi') {
                const formData = new FormData();
                formData.append('userName', form.name);
                formData.append('email', form.email);
                formData.append('packageId', selected.id);
                formData.append('planName', selected.name);
                formData.append('planPrice', selected.price);
                formData.append('paymentMethod', 'upi');
                formData.append('transactionId', form.transactionId);
                formData.append('screenshot', form.screenshotFile);
                bodyData = formData;
                // browser sets content-type for form data automatically
            } else {
                bodyData = JSON.stringify({
                    userName: form.name,
                    email: form.email,
                    packageId: selected.id,
                    planName: selected.name,
                    planPrice: selected.price,
                    paymentMethod: payTab === 'later' ? 'pay_later' : 'cash_on_bench'
                });
                headers['Content-Type'] = 'application/json';
            }

            const res = await fetch('/api/payments/verify-and-upload', {
                method: 'POST',
                headers,
                body: bodyData,
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
        if (verifyStatus === 'pending') return 'Your Pay Later request has been approved. Please note you must complete payment within the plan access period or your account may be restricted.';
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
                                    
                                    {payTab === 'upi' && (
                                        <div className="mt-5 flex flex-col items-center">
                                            <a
                                                href="https://wa.me/917387452750?text=Hi%20Tara%20Fitness!%20I%20just%20completed%20my%20UPI%20payment.%20Please%20verify%20my%20membership."
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(37,211,102,0.25)] text-xs uppercase tracking-wider w-full cursor-pointer"
                                            >
                                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-1">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                                </svg>
                                                Get UPI Receipt on WhatsApp
                                            </a>
                                        </div>
                                    )}
                                    
                                    {payTab === 'cash' && (
                                        <div className="mt-5 flex flex-col items-center">
                                            <a
                                                href="https://wa.me/917387452750?text=Hi%20Tara%20Fitness!%20I%20want%20to%20pay%20by%20cash.%20Please%20send%20payment%20instructions."
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(37,211,102,0.25)] text-xs uppercase tracking-wider w-full cursor-pointer"
                                            >
                                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-1">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                                </svg>
                                                Get Cash Instructions
                                            </a>
                                        </div>
                                    )}
                                    
                                    {payTab === 'pay_later' && (
                                        <div className="mt-5 flex flex-col items-center">
                                            <a
                                                href="https://wa.me/917387452750?text=Hi%20Tara%20Fitness!%20I%20just%20requested%20to%20Pay%20Later%20for%20my%20membership.%20Please%20verify."
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(37,211,102,0.25)] text-xs uppercase tracking-wider w-full cursor-pointer"
                                            >
                                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-1">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                                </svg>
                                                Notify on WhatsApp
                                            </a>
                                        </div>
                                    )}
                                    
                                    <button onClick={closeModal} className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-white font-semibold text-sm transition-colors w-full">Done</button>
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
                                    <div className="flex gap-2 mb-5 bg-white/5 rounded-xl p-1 overflow-x-auto">
                                        <button
                                            onClick={() => { setPayTab('upi'); setStatus('idle'); setErrMsg(''); }}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${payTab === 'upi' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <CreditCard size={14} /> UPI / QR
                                        </button>
                                        <button
                                            onClick={() => { setPayTab('cash'); setStatus('idle'); setErrMsg(''); }}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${payTab === 'cash' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Banknote size={14} /> Cash (Bench)
                                        </button>
                                        <button
                                            onClick={() => { 
                                                if (user?.allowPendingPayment === false) {
                                                    setErrMsg('Immediate payment required. You are not authorized for Pay Later.');
                                                    return;
                                                }
                                                if (selected.allowPending === false) {
                                                    setErrMsg('Pay Later is disabled for this specific plan.');
                                                    return;
                                                }
                                                setPayTab('later'); 
                                                setStatus('idle'); 
                                                setErrMsg(''); 
                                            }}
                                            disabled={user?.allowPendingPayment === false || selected.allowPending === false}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${payTab === 'later' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'} ${(user?.allowPendingPayment === false || selected.allowPending === false) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={user?.allowPendingPayment === false ? 'Immediate payment required' : selected.allowPending === false ? 'Disabled for this plan' : ''}
                                        >
                                            <Clock size={14} /> Pay Later
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
                                                
                                                {/* Locked Read-Only Amount */}
                                                <div className="relative mb-2">
                                                    <Banknote size={16} className="absolute left-3 top-5 -translate-y-1/2 text-primary" />
                                                    {discountInfo ? (
                                                        <div className="w-full pl-10 pr-4 py-3 bg-dark/70 border border-primary/30 rounded-xl text-primary font-bold text-sm cursor-not-allowed select-none">
                                                            <div className="text-gray-400 line-through text-xs font-normal">Original Price: ₹{discountInfo.originalAmount}</div>
                                                            <div className="text-red-400 text-xs font-normal my-0.5">Discount: {discountInfo.discountType === 'percentage' ? `${discountInfo.discount}%` : `₹${discountInfo.discount}`}</div>
                                                            <div className="text-green-500 font-bold">Final Payable Amount: ₹{discountInfo.finalAmount}</div>
                                                        </div>
                                                    ) : (
                                                        <input readOnly type="text" value={`Fixed Plan Amount: ₹${selected.price}`}
                                                            className="w-full pl-10 pr-4 py-3 bg-dark/70 border border-primary/30 rounded-xl text-primary font-bold focus:outline-none text-sm cursor-not-allowed select-none" />
                                                    )}
                                                    <span className="absolute right-3 top-3 text-[10px] text-gray-500 uppercase tracking-widest flex items-center"><Lock size={10} className="mr-1" />Locked</span>
                                                </div>

                                                {/* Step 1: QR + UPI Info */}
                                                <div className="flex flex-col items-center">
                                                    <p className="text-sm font-semibold text-white mb-1">Step 1: Scan & Pay</p>
                                                    <p className="text-xs text-gray-400 mb-3 text-center">Scan QR below with your phone camera, or open your UPI app and send to the UPI ID</p>

                                                    {/* Dynamic QR Code */}
                                                    <div className="bg-white p-2 rounded-lg mb-3 flex items-center justify-center h-52 w-52 shadow-xl border border-gray-200">
                                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=Tara%20Parmar&am=${rawPrice(discountInfo ? discountInfo.finalAmount : selected.price)}&cu=INR&tn=Gym%20Account`)}`} alt="UPI QR Code" className="w-full h-full object-contain" />
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
                                                        href={`upi://pay?pa=${UPI_ID}&pn=Tara%20Parmar&am=${rawPrice(selected.price)}&cu=INR&tn=Gym%20Membership%20${encodeURIComponent(selected.name)}`}
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

                                                {/* Screenshot Preview */}
                                                {preview && (
                                                    <div className="mt-2 relative rounded-lg overflow-hidden border border-white/10 h-32 w-full">
                                                        <img src={preview} alt="Payment Preview" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => { setPreview(null); setForm(f => ({ ...f, screenshotFile: null })); }}
                                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-black"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                )}
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

                                        {/* ── PAY LATER TAB CONTENT ── */}
                                        {payTab === 'later' && (
                                            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                                        <Clock size={20} className="text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">Pay Later Plan</p>
                                                        <p className="text-gray-400 text-xs">Start now, pay before expiry</p>
                                                    </div>
                                                </div>
                                                <ul className="space-y-2 text-sm text-gray-300 mb-4">
                                                    <li className="flex items-start gap-2.5">
                                                        <Check size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                                        Membership activates instantly.
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <Check size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                                        You MUST complete this payment (₹{selected.price}) before your plan duration expires.
                                                    </li>
                                                    <li className="flex items-start gap-2.5">
                                                        <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                                        Unpaid plans will result in an overdue status and access restrictions.
                                                    </li>
                                                </ul>
                                            </div>
                                        )}

                                        {status === 'error' && <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{errMsg}</p>}

                                        <button type="submit" disabled={status === 'submitting'}
                                            className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wider transition-all disabled:opacity-60 flex justify-center items-center ${payTab === 'cash' ? 'bg-green-600 hover:bg-green-700' : payTab === 'later' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                                            style={payTab === 'upi' ? { background: selected.accentColor } : {}}
                                        >
                                            {status === 'submitting' ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader size={18} className="animate-spin" /> Verifying...
                                                </span>
                                            ) : payTab === 'cash' ? (
                                                <span className="flex items-center gap-2"><Banknote size={18} /> Req. Cash Payment</span>
                                            ) : payTab === 'later' ? (
                                                <span className="flex items-center gap-2"><Clock size={18} /> Confirm Pay Later</span>
                                            ) : (
                                                'Pay & Verify'
                                            )}
                                        </button>
                                        <p className="text-xs text-gray-500 text-center mt-1">
                                            {payTab === 'upi' ? 'Our AI agent automatically verifies your payment.' : payTab === 'later' ? 'Commiting to a legally binding later payment.' : 'Your membership will be activated after cash is paid at reception.'}
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
