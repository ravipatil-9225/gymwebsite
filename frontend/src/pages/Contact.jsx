import React from 'react';
import SectionLanding from '../components/shared/SectionLanding';

const contactItems = [
    { title: 'Enquiry', icon: 'MessageSquare', path: '/forms/enquiry', desc: 'Have questions? Drop us a line.' },
    { title: 'Reviews', icon: 'Star', path: '/contact/reviews', desc: 'Read what our members have to say.' },
    { title: 'Feedback', icon: 'HeartHandshake', path: '/forms/feedback', desc: 'Help us improve our services.' },
    { title: 'Contact Info', icon: 'Phone', path: '/contact/info', desc: 'Find our location, hours, and direct lines.' }
];

const Contact = () => {
    return (
        <div className="bg-dark transition-colors duration-300">
            <SectionLanding title="Contact Us" subtitle="Get In Touch" items={contactItems} />
        </div>
    );
};

export default Contact;
