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
            </div>
        </div>
    );
};

export default TopBar;
