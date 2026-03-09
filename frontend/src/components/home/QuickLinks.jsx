import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User,
    MessageSquare,
    ShieldCheck,
    FileSignature,
    Scale,
    HelpCircle
} from 'lucide-react';

const links = [
    {
        title: 'Enquiry',
        desc: 'Have questions? Drop us a line.',
        icon: <HelpCircle className="text-[#e67e22]" size={24} />,
        bgColor: 'bg-[#fef9f0]',
        link: '/forms/enquiry'
    },
    {
        title: 'Feedback',
        desc: 'Give us your genuine suggestions.',
        icon: <MessageSquare className="text-[#9f7aea]" size={24} />,
        bgColor: 'bg-[#faf5ff]',
        link: '/forms/feedback'
    },
    {
        title: 'Trainers',
        desc: 'Achievements & Qualifications of our Trainers.',
        icon: <User className="text-[#38b2ac]" size={24} />,
        bgColor: 'bg-[#e6fffa]',
        link: '/trainers'
    },
    {
        title: 'PAR-Q Form',
        desc: 'Physical Activity Readiness Questionnaire.',
        icon: <ShieldCheck className="text-[#48bb78]" size={24} />,
        bgColor: 'bg-[#f0fff4]',
        link: '/forms/par-q'
    },
    {
        title: 'Trial Waiver',
        desc: 'Sign your 1/3-Day Trial waiver.',
        icon: <FileSignature className="text-[#ecc94b]" size={24} />,
        bgColor: 'bg-[#fffff0]',
        link: '/forms/trial-waiver'
    },
    {
        title: 'PT Contract',
        desc: 'Authorize your Personal Training.',
        icon: <Scale className="text-[#4299e1]" size={24} />,
        bgColor: 'bg-[#ebf8ff]',
        link: '/forms/pt-contract'
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const QuickLinks = () => {
    return (
        <section className="py-20 bg-dark relative border-t border-white/5" id="quick-links">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-16">
                    <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-sm mb-2 uppercase">Explore</h2>
                    <h1 className="text-white text-4xl md:text-5xl font-display font-bold uppercase tracking-wider">Quick <span className="text-primary font-light">Links</span></h1>
                    <div className="w-24 h-1 bg-primary mx-auto mt-6"></div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
                >
                    {links.map((item, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <Link
                                to={item.link}
                                className="bg-dark-card border border-white/5 hover:border-primary/50 transition-colors duration-300 rounded-xl p-5 flex items-center gap-5 group cursor-pointer shadow-lg hover:shadow-primary/10 w-full"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bgColor} shadow-inner`}>
                                    {item.icon}
                                </div>
                                <div className="flex flex-col text-left">
                                    <h3 className="text-white font-display text-xl tracking-wide group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-gray-400 font-sans text-sm mt-0.5 leading-snug">{item.desc}</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
};

export default QuickLinks;
