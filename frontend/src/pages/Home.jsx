import React from 'react';
import Hero from '../components/home/Hero';
import QuickLinks from '../components/home/QuickLinks';
import Contact from '../components/home/Contact';

const Home = () => {
    return (
        <div className="w-full">
            <Hero />
            <QuickLinks />
            <Contact />
        </div>
    );
};

export default Home;
