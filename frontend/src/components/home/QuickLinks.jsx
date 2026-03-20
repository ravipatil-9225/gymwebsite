import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    HelpCircle, MessageSquare, User, ShieldCheck, FileSignature, Scale, ArrowRight
} from 'lucide-react';

const links = [
    {
        title: 'Enquiry',
        desc: 'Have questions? Drop us a line.',
        icon: HelpCircle,
        color: '#e67e22',
        glow: 'rgba(230,126,34,0.18)',
        link: '/forms/enquiry',
    },
    {
        title: 'Feedback',
        desc: 'Give us your genuine suggestions.',
        icon: MessageSquare,
        color: '#9f7aea',
        glow: 'rgba(159,122,234,0.18)',
        link: '/forms/feedback',
    },
    {
        title: 'Our Trainers',
        desc: 'Achievements & Qualifications.',
        icon: User,
        color: '#38b2ac',
        glow: 'rgba(56,178,172,0.18)',
        link: '/trainers',
    },
    {
        title: 'PAR-Q Form',
        desc: 'Physical Activity Readiness Questionnaire.',
        icon: ShieldCheck,
        color: '#48bb78',
        glow: 'rgba(72,187,120,0.18)',
        link: '/forms/par-q',
    },
    {
        title: 'Trial Waiver',
        desc: 'Sign your 1/3-Day Trial waiver.',
        icon: FileSignature,
        color: '#ecc94b',
        glow: 'rgba(236,201,75,0.18)',
        link: '/forms/trial-waiver',
    },
    {
        title: 'PT Contract',
        desc: 'Authorize your Personal Training.',
        icon: Scale,
        color: '#4299e1',
        glow: 'rgba(66,153,225,0.18)',
        link: '/forms/pt-contract',
    },
];

const QuickLinks = () => {
    return (
        <section className="py-28 relative border-t border-white/[0.04]" id="quick-links">
            {/* Background */}
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="section-eyebrow mb-4"
                    >
                        Explore
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-5xl md:text-6xl font-display font-black uppercase tracking-tight"
                    >
                        Quick <span className="text-gradient">Links</span>
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-px w-24 bg-gradient-to-r from-primary to-transparent mx-auto mt-6 origin-left"
                    />
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {links.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } } }}
                            >
                                <Link
                                    to={item.link}
                                    className="group flex items-center gap-5 p-5 rounded-2xl transition-all duration-400 cursor-pointer relative overflow-hidden premium-card"
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = `${item.color}35`;
                                        e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 35px ${item.glow}`;
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '';
                                        e.currentTarget.style.boxShadow = '';
                                        e.currentTarget.style.transform = '';
                                    }}
                                >
                                    {/* Gradient hover bg */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                                        style={{ background: `radial-gradient(circle at 20% 50%, ${item.glow} 0%, transparent 70%)` }}
                                    />

                                    {/* Icon */}
                                    <div
                                        className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                                        style={{
                                            background: `${item.color}15`,
                                            border: `1px solid ${item.color}25`,
                                        }}
                                    >
                                        <Icon size={22} style={{ color: item.color }} />
                                    </div>

                                    {/* Text */}
                                    <div className="relative z-10 flex-1 text-left">
                                        <h3 className="text-white font-display text-lg tracking-wide group-hover:text-white/90 transition-colors">{item.title}</h3>
                                        <p className="text-gray-600 font-sans text-xs mt-0.5 group-hover:text-gray-500 transition-colors leading-snug">{item.desc}</p>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight
                                        size={16}
                                        className="relative z-10 text-white/20 group-hover:-translate-y-0 group-hover:translate-x-1 group-hover:text-white/60 transition-all duration-300 shrink-0"
                                    />
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default QuickLinks;
