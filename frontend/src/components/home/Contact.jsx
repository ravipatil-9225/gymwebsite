import React from 'react';
import { User, Phone, MapPin, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
    return (
        <section className="py-20 bg-dark relative border-t border-white/5" id="contact">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-sm mb-2 uppercase">Get In Touch</h2>
                    <h1 className="text-white text-4xl md:text-5xl font-display font-bold uppercase tracking-wider">Contact <span className="text-primary font-light">Us</span></h1>
                    <div className="w-24 h-1 bg-primary mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Owner Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="glass-card p-8 rounded-xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
                    >
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-6 border-2 border-primary/50 group-hover:border-primary transition-colors shadow-[0_0_15px_rgba(227,74,41,0.2)]">
                            <img
                                src="/owner.jpg"
                                alt="Tarachand paramar"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to initial if image not placed yet
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">TP</div>';
                                }}
                            />
                        </div>
                        <h3 className="text-white font-display text-xl mb-2 tracking-wide">Owner</h3>
                        <p className="text-gray-400 font-sans">Tarachand paramar</p>
                    </motion.div>

                    {/* Phone/WhatsApp Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="glass-card p-8 rounded-xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                            <Phone size={28} className="text-primary" />
                        </div>
                        <h3 className="text-white font-display text-xl mb-2 tracking-wide">Phone</h3>
                        <p className="text-gray-400 font-sans mb-4">+91 99605 52750</p>
                        <a
                            href="https://wa.me/919960552750"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-[#25D366] hover:text-[#1ebe57] transition-colors font-semibold bg-[#25D366]/10 px-4 py-2 rounded-full"
                        >
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                            </svg>
                            <span>Chat on WhatsApp</span>
                        </a>
                    </motion.div>

                    {/* Location Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="glass-card p-8 rounded-xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300 lg:col-span-2"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                            <MapPin size={28} className="text-primary" />
                        </div>
                        <h3 className="text-white font-display text-xl mb-2 tracking-wide">Location</h3>
                        <p className="text-gray-400 font-sans mb-4">Shop No 1, Kalamba Rd, opp. Surveynagar,<br />Ramkrishna Nagar, Survey Nagar,<br />Kolhapur, Maharashtra 416007</p>
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=Shop+No+1,+Kalamba+Rd,+opp.+Surveynagar,+Ramkrishna+Nagar,+Survey+Nagar,+Kolhapur,+Maharashtra+416007"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-white transition-colors underline decoration-primary/30 hover:decoration-white underline-offset-4 font-semibold"
                        >
                            Open in Google Maps
                        </a>
                    </motion.div>
                </div>

                {/* Socials / Instagram Highlight */}
                <div className="mt-16 text-center">
                    <h3 className="text-white font-display text-2xl mb-6 tracking-wide">Follow Our Journey</h3>
                    <a
                        href="https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg=="
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white px-8 py-4 rounded-full font-bold tracking-wide hover:opacity-90 transition-opacity shadow-lg shadow-[#fd1d1d]/20 hover:-translate-y-1 transform duration-300"
                    >
                        <Instagram size={24} />
                        <span>@tara_.parmar</span>
                    </a>
                </div>

            </div>
        </section>
    );
};

export default Contact;
