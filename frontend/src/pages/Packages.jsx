import React from 'react';
import SectionLanding from '../components/shared/SectionLanding';

const packageItems = [
    { title: 'Membership Plans', icon: 'CreditCard', path: '/packages/plans', desc: 'Explore our standard and premium membership packages.' },
    { title: 'Offers', icon: 'Tag', path: '#offers', desc: 'View current seasonal offers and discounts.' }
];

const Packages = () => {
    return (
        <div className="bg-dark transition-colors duration-300">
            <SectionLanding
                title="Packages"
                subtitle="Choose Your Path"
                items={packageItems}
            />
        </div>
    );
};

export default Packages;
