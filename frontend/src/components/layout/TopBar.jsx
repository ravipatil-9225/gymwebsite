import React from 'react';
import { User, Phone, MapPin, Instagram } from 'lucide-react';

const TopBar = () => {
    return (
        <div className="bg-[#0f0f0f] border-b border-white/5 py-2 px-6 hidden md:flex justify-between items-center text-xs text-gray-400 font-sans fixed top-0 w-full z-50">
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 hover:text-primary transition-colors cursor-pointer">
                    <User size={12} className="text-primary" />
                    <span>Tarachand paramar</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-primary transition-colors cursor-pointer">
                    <Phone size={12} className="text-primary" />
                    <span>+91 99605 52750</span>
                </div>
                <a
                    href="https://www.google.com/maps/search/?api=1&query=Shop+No+1,+Kalamba+Rd,+opp.+Surveynagar,+Ramkrishna+Nagar,+Survey+Nagar,+Kolhapur,+Maharashtra+416007"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 hover:text-primary transition-colors cursor-pointer w-72 lg:w-96"
                    title="Shop No 1, Kalamba Rd, opp. Surveynagar, Ramkrishna Nagar, Survey Nagar, Kolhapur, Maharashtra 416007"
                >
                    <MapPin size={12} className="text-primary shrink-0" />
                    <span className="truncate">Shop No 1, Kalamba Rd, opp. Surveynagar, Ramkrishna Nagar, Kolhapur</span>
                </a>
            </div>

            <div className="flex items-center space-x-4">
                {/* Instagram */}
                <a
                    href="https://www.instagram.com/tara_.parmar?igsh=MWVvcWsyYXlzajBwcg=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors shrink-0"
                    title="Instagram"
                >
                    <Instagram size={14} />
                </a>

                {/* WhatsApp Button */}
                <a
                    href="https://wa.me/917387452750?text=Hi%20Tara%20Fitness!%20I%20just%20registered%20on%20the%20website%20and%20want%20to%20activate%20my%20account."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white px-3 py-1 rounded-full border border-[#25D366]/20 transition-all duration-300 font-medium text-[11px] tracking-wide hover:scale-105 active:scale-95 shrink-0"
                    title="Connect with us on WhatsApp"
                >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    <span>Connect with us on WhatsApp</span>
                </a>
            </div>
        </div>
    );
};

export default TopBar;
