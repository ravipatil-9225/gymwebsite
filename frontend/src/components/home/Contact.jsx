import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Instagram, ExternalLink, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import socket from '../../utils/socket';

const Contact = () => {
    const [cmsData, setCmsData] = useState({
        phone: "+91 99605 52750",
        address: "Shop No 1, Kalamba Rd, opp. Surveynagar,\nRamkrishna Nagar, Kolhapur, Maharashtra 416007"
    });

    useEffect(() => {
        const fetchFooter = async () => {
            try {
                const { data } = await axios.get('/api/public/content/footer');
                if (data && data.data && Object.keys(data.data).length > 0) {
                    setCmsData({
                        phone: data.data.phone || '+91 99605 52750',
                        address: data.data.address || "Shop No 1, Kalamba Rd, opp. Surveynagar,\nRamkrishna Nagar, Kolhapur, Maharashtra 416007"
                    });
                }
            } catch (err) {
                console.error("Failed to fetch footer content");
            }
        };

        fetchFooter();
        socket.on('db_changed', fetchFooter);

        return () => {
            socket.off('db_changed', fetchFooter);
        };
    }, []);

    return (
        <section className="py-28 relative border-t border-white/[0.04] overflow-hidden" id="contact">
            {/* Background */}
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
            <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-20">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="section-eyebrow mb-4"
                    >
                        Get In Touch
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white text-5xl md:text-7xl font-display font-black uppercase tracking-tight"
                    >
                        Contact <span className="text-gradient">Us</span>
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-px w-24 bg-gradient-to-r from-primary to-transparent mx-auto mt-6 origin-left"
                    />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">

                    {/* Owner Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="premium-card p-7 rounded-2xl flex flex-col items-center text-center"
                    >
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_30px_rgba(227,74,41,0.2)]">
                                <img
                                    src="/owner.jpg"
                                    alt="Tarachand Parmar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl font-display">TP</div>';
                                    }}
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(227,74,41,0.5)]">
                                <span className="text-white text-[10px] font-bold">✓</span>
                            </div>
                        </div>
                        <span className="section-eyebrow text-[10px] mb-1">Founder & Owner</span>
                        <h3 className="text-white font-display text-xl tracking-wide">Tarachand Parmar</h3>
                    </motion.div>

                    {/* Phone Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="premium-card p-7 rounded-2xl flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(227,74,41,0.12)]">
                            <Phone size={26} className="text-primary" />
                        </div>
                        <span className="section-eyebrow text-[10px] mb-2">Phone / WhatsApp</span>
                        <p className="text-white font-display text-lg tracking-wide mb-5">{cmsData.phone}</p>
                        <a
                            href={`https://wa.me/${cmsData.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 text-[#25D366] px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,211,102,0.2)]"
                        >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                            </svg>
                            Chat on WhatsApp
                        </a>
                    </motion.div>

                    {/* Location Card - spans 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="premium-card p-7 rounded-2xl flex flex-col items-center text-center lg:col-span-2"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(227,74,41,0.12)]">
                            <MapPin size={26} className="text-primary" />
                        </div>
                        <span className="section-eyebrow text-[10px] mb-2">Location</span>
                        <h3 className="text-white font-display text-xl tracking-wide mb-3">Find Us Here</h3>
                        <p className="text-gray-500 font-sans text-sm leading-relaxed mb-5 whitespace-pre-line">
                            {cmsData.address}
                        </p>
                        <a
                            href="https://maps.app.goo.gl/BANt7yyCSZReYRpw6"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/25 hover:border-primary px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:shadow-[0_0_25px_rgba(227,74,41,0.4)]"
                        >
                            <MapPin size={14} />
                            Open in Google Maps
                            <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </motion.div>
                </div>

                {/* Socials */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="pt-12 border-t border-white/[0.05] text-center"
                >
                    <p className="section-eyebrow mb-6 text-[10px]">Follow Our Journey</p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {[
                            { handle: '@tara_.parmar', url: 'https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==' },
                            { handle: '@tara_fitness_centre', url: 'https://www.instagram.com/tara_fitness_centre?igsh=MTRzd3E5c3RlZzJqdA==' },
                        ].map((acc, i) => (
                            <a
                                key={i}
                                href={acc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-300 hover:-translate-y-1"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(131,58,180,0.8), rgba(253,29,29,0.8), rgba(252,176,69,0.8))',
                                    boxShadow: '0 8px 30px rgba(253,29,29,0.2)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 15px 40px rgba(253,29,29,0.35)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(253,29,29,0.2)'}
                            >
                                <Instagram size={18} />
                                <span>{acc.handle}</span>
                                <ExternalLink size={13} className="opacity-60 group-hover:opacity-100" />
                            </a>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
