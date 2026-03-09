import React from 'react';
import SectionLanding from '../components/shared/SectionLanding';

const serviceItems = [
    { title: 'Book Group Class', icon: 'CalendarDays', path: '/forms/book-class', desc: 'Reserve your spot in our high-energy group sessions.' },
    { title: 'Book PT Sessions', icon: 'Dumbbell', path: '/forms/book-pt', desc: 'Schedule 1-on-1 time with our elite trainers.' },
    { title: 'PAR-Q', icon: 'ClipboardCheck', path: '/forms/par-q', desc: 'Complete your Physical Activity Readiness Questionnaire.' },
    { title: 'PT Contract', icon: 'FileText', path: '/forms/pt-contract', desc: 'Review and sign your personal training agreement.' },
    { title: 'Trial Waiver', icon: 'ShieldCheck', path: '/forms/trial-waiver', desc: 'Sign your waiver to get started with a free trial.' }
];

const ServicesPage = () => {
    return (
        <div className="bg-dark transition-colors duration-300">
            <SectionLanding
                title="Our Services"
                subtitle="Manage Your Fitness Journey"
                items={serviceItems}
            />
        </div>
    );
};

export default ServicesPage;
