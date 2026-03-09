import React from 'react';

const PlaceholderPage = ({ title }) => {
    return (
        <div className="min-h-[85vh] flex items-center justify-center bg-dark px-4">
            <div className="text-center">
                <h1 className="text-white text-5xl font-display font-bold uppercase tracking-wider mb-4">
                    {title}
                </h1>
                <p className="text-gray-400 font-sans tracking-widest uppercase">
                    Coming Soon
                </p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
