import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Dumbbell, Flame, Apple, Target, Weight, Music, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
    {
        title: "Aerobics",
        desc: "Cardiovascular workouts to improve heart health and stamina.",
        icon: Activity,
        color: "#38b2ac",
        glow: "rgba(56,178,172,0.2)",
    },
    {
        title: "Crossfit",
        desc: "High-intensity functional training to build strength and conditioning.",
        icon: Dumbbell,
        color: "#f56565",
        glow: "rgba(245,101,101,0.2)",
    },
    {
        title: "HIIT Classes",
        desc: "High-Intensity Interval Training to burn fat and boost metabolism.",
        icon: Flame,
        color: "#ed8936",
        glow: "rgba(237,137,54,0.2)",
    },
    {
        title: "Nutrition",
        desc: "Personalized diet plans to complement your fitness goals.",
        icon: Apple,
        color: "#48bb78",
        glow: "rgba(72,187,120,0.2)",
    },
    {
        title: "Personal Training",
        desc: "One-on-one coaching for tailored and faster results.",
        icon: Target,
        color: "#4299e1",
        glow: "rgba(66,153,225,0.2)",
    },
    {
        title: "Weight Training",
        desc: "Build muscle, increase bone density, and sculpt your physique.",
        icon: Weight,
        color: "#9f7aea",
        glow: "rgba(159,122,234,0.2)",
    },
    {
        title: "Zumba",
        desc: "Dance-based fitness program that makes working out fun.",
        icon: Music,
        color: "#ed64a6",
        glow: "rgba(237,100,166,0.2)",
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 18 } }
};

const Services = () => {
    return (
        <section className="py-28 relative border-t border-white/[0.04] overflow-hidden" id="services">
            {/* Background */}
            <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/4 rounded-full blur-[130px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="section-eyebrow mb-4"
                    >
                        What We Offer
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-5xl md:text-7xl font-display font-black uppercase tracking-tight leading-none"
                    >
                        Our <span className="text-gradient">Services</span>
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-px w-24 bg-gradient-to-r from-primary to-transparent mx-auto mt-6 origin-left"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-500 font-sans mt-5 text-sm max-w-lg mx-auto leading-relaxed"
                    >
                        World-class equipment, elite coaching, and transformative programs designed to take your fitness to the next level.
                    </motion.p>
                </div>

                {/* Services Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                    {services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className={`group relative rounded-2xl p-7 cursor-pointer overflow-hidden transition-all duration-500 premium-card ${index === 6 ? 'sm:col-span-2 lg:col-span-3 xl:col-span-1' : ''}`}
                                whileHover={{
                                    y: -6,
                                    boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 40px ${service.glow}`,
                                    borderColor: `${service.color}40`,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                {/* Gradient overlay on hover */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 30% 20%, ${service.glow} 0%, transparent 70%)` }}
                                />

                                {/* Icon */}
                                <div
                                    className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110"
                                    style={{
                                        background: `${service.color}15`,
                                        border: `1px solid ${service.color}25`,
                                        boxShadow: `0 0 0 0 ${service.glow}`,
                                    }}
                                >
                                    <Icon size={26} style={{ color: service.color }} />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <h3
                                        className="text-white font-display text-xl font-bold tracking-wide mb-2 transition-colors duration-300"
                                        style={{ '--tw-text-opacity': 1 }}
                                    >
                                        <span className="group-hover:text-white" style={{ color: 'inherit' }}>
                                            {service.title}
                                        </span>
                                    </h3>
                                    <p className="text-gray-500 font-sans text-sm leading-relaxed group-hover:text-gray-400 transition-colors duration-300">
                                        {service.desc}
                                    </p>
                                </div>

                                {/* Bottom accent line */}
                                <div
                                    className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
                                    style={{ background: `linear-gradient(to right, ${service.color}, transparent)` }}
                                />

                                {/* Corner number */}
                                <span className="absolute top-4 right-4 text-white/5 font-display text-4xl font-black select-none">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-14"
                >
                    <Link
                        to="/services"
                        className="group inline-flex items-center gap-2 text-primary hover:text-white text-sm font-bold tracking-wider uppercase transition-all duration-300 border border-primary/30 hover:border-primary hover:bg-primary px-8 py-3.5 rounded-xl hover:shadow-[0_0_30px_rgba(227,74,41,0.4)]"
                    >
                        View All Services
                        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default Services;
