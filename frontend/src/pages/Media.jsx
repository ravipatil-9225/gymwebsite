import React from 'react';
import SectionLanding from '../components/shared/SectionLanding';

const mediaItems = [
    { title: 'Photo Gallery', icon: 'Image', path: '/media/gallery', desc: 'Explore our state-of-the-art facility.' },
    { title: 'Transformations', icon: 'Zap', path: '/media/transformations', desc: 'See real results from our dedicated members.' }
];

const Media = () => {
    return (
        <div className="bg-dark transition-colors duration-300">
            <SectionLanding title="Media" subtitle="Inspiration Hub" items={mediaItems} />
        </div>
    );
};

export default Media;
