import React from 'react';
import SectionLanding from '../components/shared/SectionLanding';

const portalItems = [
    { title: 'Client Login', icon: 'LogIn', path: '/login', desc: 'Access your secure member account.' },
    { title: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard', desc: 'View your progress, bookings, and plans.' }
];

const Portal = () => {
    return (
        <div className="bg-dark transition-colors duration-300">
            <SectionLanding title="Member Portal" subtitle="Your Account" items={portalItems} />
        </div>
    );
};

export default Portal;
