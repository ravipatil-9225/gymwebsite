import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Dumbbell,
    Flame,
    Apple,
    Target,
    Weight,
    Music
} from 'lucide-react';

const services = [
    {
        title: "Aerobics",
        desc: "Cardiovascular workouts to improve heart health and stamina.",
        icon: <Activity size={32} className="text-[#38b2ac]" />,
        delay: 0.1
    },
    {
        title: "Crossfit",
        desc: "High-intensity functional training to build strength and conditioning.",
        icon: <Dumbbell size={32} className="text-[#f56565]" />,
        delay: 0.2
    },
    {
        title: "HIIT exercise classes",
        desc: "High-Intensity Interval Training to burn fat and boost metabolism.",
        icon: <Flame size={32} className="text-[#ed8936]" />,
        delay: 0.3
    },
    {
        title: "Nutrition consulting",
        desc: "Personalized diet plans to complement your fitness goals.",
        icon: <Apple size={32} className="text-[#48bb78]" />,
        delay: 0.4
    },
    {
        title: "Personal training",
        desc: "One-on-one coaching for tailored and faster results.",
        icon: <Target size={32} className="text-[#4299e1]" />,
        delay: 0.5
    },
    {
        title: "Weight training",
        desc: "Build muscle, increase bone density, and sculpt your physique.",
        icon: <Weight size={32} className="text-[#9f7aea]" />,
        delay: 0.6
    },
    {
        title: "Zumba",
        desc: "Dance-based fitness program that makes working out fun.",
        icon: <Music size={32} className="text-[#ed64a6]" />,
        delay: 0.7
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const Services = () => {
    return (
        <section className="py-24 bg-dark relative border-t border-white/5 overflow-hidden" id="services">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary tracking-[0.2em] font-sans font-semibold text-sm mb-3 uppercase"
                    >
                        What We Offer
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-4xl md:text-6xl font-display font-bold uppercase tracking-wider"
                    >
                        Our <span className="text-primary font-light">Services</span>
                    </motion.h1>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "96px" }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 bg-gradient-to-r from-primary to-transparent mx-auto mt-8"
                    ></motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
                >
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className={`group relative bg-dark-card border border-white/5 hover:border-primary/30 rounded-2xl p-8 transition-all duration-500 overflow-hidden cursor-pointer ${index === 6 ? 'md:col-span-2 lg:col-span-3 xl:col-span-1 xl:col-start-4' : ''}`}
                            style={{
                                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
                            }}
                        >
                            {/* Hover Gradient Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Icon Container */}
                            <div className="relative z-10 w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 group-hover:rotate-3 group-hover:border-primary/20 transition-all duration-500 shadow-inner">
                                {service.icon}
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h3 className="text-white font-display text-2xl font-bold tracking-wide mb-3 group-hover:text-primary transition-colors duration-300">
                                    {service.title}
                                </h3>
                                <p className="text-gray-400 font-sans leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                                    {service.desc}
                                </p>
                            </div>

                            {/* Decorative bottom line */}
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-primary group-hover:w-full transition-all duration-500 ease-out"></div>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
};

export default Services;
