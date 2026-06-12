const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

async function upload() {
    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    const result = await cloudinary.uploader.upload(logoPath, {
        folder: 'gym_assets',
        public_id: 'tara_fitness_logo'
    });
    console.log("Uploaded Logo URL:", result.secure_url);
}

upload().catch(console.error);
