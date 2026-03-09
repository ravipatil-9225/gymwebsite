import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Dumbbell, Activity, Target, Zap, Shield, Crown, X, Loader, CheckCircle, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const plans = [
    {
        name: 'Bronze Beast Plan',
        tagline: null,
        price: '1,000',
        duration: 'per month',
        description: 'Perfect for beginners starting their fitness journey. Get full access to hardcore strength training equipment and build your base strength.',
        includes: [
            'Hardcore workout area access',
            'Strength training equipment',
            'Gym environment & guidance',
        ],
        icon: <Dumbbell size={28} className="text-[#CD7F32]" />,
        accentColor: '#CD7F32',
        popular: false,
        bestValue: false,
        gradient: 'from-[#CD7F32]/15 to-transparent',
        border: 'hover:border-[#CD7F32]/50',
        badgeBg: 'bg-[#CD7F32]',
    },
    {
        name: 'Silver Cardio Burn',
        tagline: null,
        price: '1,200',
        duration: 'per month',
        description: 'Designed for people who want strength + fat burning workouts. Combine hardcore training with intense cardio sessions.',
        includes: [
            'Hardcore workout training',
            'Cardio machines (treadmill, cycling, etc.)',
            'Fat burning workout support',
        ],
        icon: <Activity size={28} className="text-[#9e9e9e]" />,
        accentColor: '#9e9e9e',
        popular: false,
        bestValue: false,
        gradient: 'from-[#9e9e9e]/15 to-transparent',
        border: 'hover:border-[#9e9e9e]/50',
        badgeBg: 'bg-[#9e9e9e]',
    },
    {
        name: 'Gold Transformation Plan',
        tagline: 'Most Popular',
        price: '1,500',
        duration: 'per month',
        description: 'A complete fitness experience with personal training guidance. Ideal for fast results and a fully structured workout plan.',
        includes: [
            'Hardcore training',
            'Cardio training',
            'Personal Trainer guidance',
            'Personalized workout routine',
        ],
        icon: <Target size={28} className="text-[#FFD700]" />,
        accentColor: '#FFD700',
        popular: true,
        bestValue: false,
        gradient: 'from-[#FFD700]/15 to-transparent',
        border: 'border-[#FFD700]/40 hover:border-[#FFD700]/70',
        badgeBg: 'bg-[#FFD700] text-black',
    },
    {
        name: 'Beast Mode',
        tagline: null,
        price: '3,000',
        duration: 'for 3 months',
        description: 'Commit to your fitness goals with a 3-month transformation program. Build consistency and noticeable results.',
        includes: [
            'Full gym access',
            'Hardcore + Cardio training',
            'Progress monitoring',
        ],
        icon: <Zap size={28} className="text-[#ed8936]" />,
        accentColor: '#ed8936',
        popular: false,
        bestValue: false,
        gradient: 'from-[#ed8936]/15 to-transparent',
        border: 'hover:border-[#ed8936]/50',
        badgeBg: 'bg-[#ed8936]',
    },
    {
        name: 'Titan Strength Plan',
        tagline: null,
        price: '6,000',
        duration: 'for 6 months',
        description: 'For serious fitness enthusiasts ready for long-term muscle growth and endurance building.',
        includes: [
            'Full gym access',
            'Strength & cardio training',
            'Long-term fitness progress',
        ],
        icon: <Shield size={28} className="text-[#4299e1]" />,
        accentColor: '#4299e1',
        popular: false,
        bestValue: false,
        gradient: 'from-[#4299e1]/15 to-transparent',
        border: 'hover:border-[#4299e1]/50',
        badgeBg: 'bg-[#4299e1]',
    },
    {
        name: 'Platinum Champion Plan',
        tagline: 'Best Value',
        price: '9,000',
        duration: 'for 12 months',
        description: 'The ultimate fitness package for those who want complete body transformation and year-long commitment to health and strength.',
        includes: [
            'Unlimited gym access',
            'Hardcore + Cardio training',
            'Best value yearly membership',
        ],
        icon: <Crown size={28} className="text-[#a78bfa]" />,
        accentColor: '#a78bfa',
        popular: false,
        bestValue: true,
        gradient: 'from-[#a78bfa]/15 to-transparent',
        border: 'border-[#a78bfa]/40 hover:border-[#a78bfa]/70',
        badgeBg: 'bg-[#a78bfa]',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

const MembershipPlans = () => {
    const { user } = useContext(AuthContext);
    const [selected, setSelected] = useState(null); // { name, price, accentColor }
    const [form, setForm] = useState({ name: '', email: '' });
    const [status, setStatus] = useState('idle'); // idle | submitting | success | error
    const [errMsg, setErrMsg] = useState('');

    const openModal = (plan) => {
        setSelected(plan);
        setForm({ name: user?.name || '', email: user?.email || '' });
        setStatus('idle');
        setErrMsg('');
    };

    const closeModal = () => { setSelected(null); setStatus('idle'); };

    const handleChoose = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const res = await fetch('/api/plan-interest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    planName: selected.name,
                    planPrice: selected.price,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to submit');
            setStatus('success');
        } catch (err) {
            setErrMsg(err.message);
            setStatus('error');
        }
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
                        Membership <span className="text-primary font-light">Plans</span>
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

                {/* Plans Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className={`relative bg-dark-card border ${plan.popular || plan.bestValue ? plan.border : `border-white/5 ${plan.border}`} rounded-2xl p-8 transition-all duration-500 group overflow-hidden shadow-xl flex flex-col`}
                            style={plan.popular || plan.bestValue ? { boxShadow: `0 0 40px ${plan.accentColor}18` } : {}}
                        >
                            {/* Hover gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            {/* Badge */}
                            {(plan.popular || plan.bestValue) && (
                                <div className={`absolute top-0 right-0 ${plan.badgeBg} text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest`}>
                                    {plan.popular ? 'Most Popular' : 'Best Value'}
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
                            className="bg-dark-card border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
                        >
                            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>

                            {status === 'success' ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-display font-bold text-white mb-2">Request Received!</h3>
                                    <p className="text-gray-400 text-sm">We've sent a confirmation to <strong className="text-white">{form.email}</strong>. Our team will contact you shortly.</p>
                                    <button onClick={closeModal} className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-white font-semibold text-sm transition-colors">Done</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">{selected.icon}</div>
                                        <div>
                                            <h3 className="text-lg font-display font-bold text-white">{selected.name}</h3>
                                            <p className="text-sm font-sans" style={{ color: selected.accentColor }}>₹{selected.price} {selected.duration}</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleChoose} className="space-y-4">
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

                                        {status === 'error' && <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{errMsg}</p>}

                                        <button type="submit" disabled={status === 'submitting'}
                                            className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wider transition-all disabled:opacity-60"
                                            style={{ background: selected.accentColor }}
                                        >
                                            {status === 'submitting' ? <Loader size={18} className="animate-spin mx-auto" /> : 'Confirm Plan Interest'}
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">Our team will contact you to confirm and process payment.</p>
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

export default MembershipPlans;
