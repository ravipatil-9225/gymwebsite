import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <div className="relative w-full h-[88vh] flex items-center justify-center overflow-hidden bg-dark">

            {/* Background Graphic / Overlay */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#050505]">
                <div
                    className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-[0.85] mix-blend-screen"
                    style={{ backgroundImage: "url('/hero_bg.png')" }}
                />
                {/* Gradients to blend the bottom and edges into the dark background */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-dark/50" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-dark to-transparent" />
            </div>

            {/* Main Typography & Content */}
            <div className="relative z-10 text-center flex flex-col items-center justify-center w-full px-4 h-full pt-10">

                {/* Decorative X's */}
                <div className="absolute left-[15%] top-[15%] hidden md:block text-primary font-mono text-2xl font-bold tracking-[0.5em] opacity-80">
                    x x
                </div>
                <div className="absolute right-[20%] top-[25%] hidden md:block text-primary font-mono text-2xl font-bold tracking-[0.5em] opacity-80">
                    x x
                </div>

                {/* Small intro text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center space-x-4 mb-4"
                >
                    <div className="w-8 md:w-16 h-[2px] bg-primary"></div>
                    <p className="text-white tracking-[0.4em] font-sans font-semibold text-xs md:text-sm">
                        BUILD YOUR BODY
                    </p>
                    <div className="w-8 md:w-16 h-[2px] bg-primary"></div>
                </motion.div>

                {/* Huge Typography layered behind and in front. */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="flex flex-col items-center font-display leading-[0.85] relative w-full pt-4"
                >
                    <h1 className="text-white text-[12vw] md:text-[9vw] font-bold uppercase tracking-wide drop-shadow-2xl">
                        Obtain
                    </h1>

                    <h1 className="text-white text-[18vw] md:text-[14vw] font-black uppercase tracking-widest z-20 drop-shadow-[0_0_30px_rgba(227,74,41,0.4)] relative">
                        Fitness
                    </h1>

                    <div className="flex items-center justify-end w-full max-w-5xl pr-4 md:pr-12 relative -top-6 md:-top-12">
                        <h1 className="text-white text-[14vw] md:text-[10vw] font-bold uppercase tracking-wide drop-shadow-2xl">
                            Goal
                        </h1>
                    </div>
                </motion.div>

                {/* Decor Dots */}
                <div className="absolute right-[12%] bottom-[25%] hidden lg:grid grid-cols-2 gap-2.5 opacity-60">
                    {[...Array(8)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />)}
                </div>
                <div className="absolute left-[8%] bottom-[35%] hidden lg:grid grid-cols-2 gap-2.5 opacity-60">
                    {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />)}
                </div>

            </div>

        </div>
    );
};

export default Hero;
