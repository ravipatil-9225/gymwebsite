import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Instagram, Mail, Clock } from 'lucide-react';

const ContactInfo = () => {
    return (
        <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-dark">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl w-full glass-card p-8 md:p-12 rounded-2xl relative z-10 shadow-2xl border-white/10"
            >
                <div className="text-center mb-12">
                    <h2 className="text-primary tracking-[0.2em] font-sans font-semibold text-xs mb-2 uppercase">We're Here For You</h2>
                    <h1 className="text-white text-4xl font-display font-bold uppercase tracking-wider">Contact Details</h1>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                        Whether you want to drop by for a tour, give us a call, or send a message on social media, we are always ready to help you on your fitness journey.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Founder & Direct Contact */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-white font-display text-2xl font-bold tracking-wide mb-6 border-b border-white/10 pb-4">Direct Contact</h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4 group">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors shrink-0">
                                        <Phone className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-sans mb-1 uppercase tracking-wider">Tarachand Paramar</p>
                                        <a href="tel:+919960552750" className="text-white font-semibold text-lg hover:text-primary transition-colors block">
                                            +91 99605 52750
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 group">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#25D366]/10 transition-colors shrink-0">
                                        <svg width="20" height="20" fill="currentColor" className="text-[#25D366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-sans mb-1 uppercase tracking-wider">WhatsApp Us</p>
                                        <a href="https://wa.me/919960552750" target="_blank" rel="noopener noreferrer" className="text-white font-semibold text-lg hover:text-[#25D366] transition-colors block">
                                            Message on WhatsApp
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 group">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#E1306C]/10 transition-colors shrink-0">
                                        <Instagram className="w-5 h-5 text-[#E1306C]" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-sans mb-1 uppercase tracking-wider">Follow Us</p>
                                        <a href="https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg==" target="_blank" rel="noopener noreferrer" className="text-white font-semibold text-lg hover:text-[#E1306C] transition-colors block">
                                            @tara_.parmar
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location & Hours */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-white font-display text-2xl font-bold tracking-wide mb-6 border-b border-white/10 pb-4">Our Location</h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4 group">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors shrink-0">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-sans mb-1 uppercase tracking-wider">Tara Fitness Center</p>
                                        <a
                                            href="https://www.google.com/maps/search/?api=1&query=Shop+No+1,+Kalamba+Rd,+opp.+Surveynagar,+Ramkrishna+Nagar,+Survey+Nagar,+Kolhapur,+Maharashtra+416007"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white leading-relaxed hover:text-primary transition-colors block"
                                        >
                                            Shop No 1, Kalamba Rd, <br />
                                            opp. Surveynagar, Ramkrishna Nagar, <br />
                                            Survey Nagar, Kolhapur, <br />
                                            Maharashtra 416007
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 group">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/10 transition-colors shrink-0">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-sans mb-1 uppercase tracking-wider">Opening Hours</p>
                                        <p className="text-white leading-relaxed">
                                            <span className="block mb-1">Mon - Sat: 5:00 AM - 10:00 PM</span>
                                            <span className="block text-gray-500">Sunday: Closed</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ContactInfo;
