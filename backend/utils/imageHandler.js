const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

const compressProfileImage = async (buffer) => {
    return await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .toFormat('webp')
        .webp({ quality: 65 })
        .toBuffer();
};

const compressPaymentScreenshot = async (buffer) => {
    return await sharp(buffer)
        .resize(800, null, { withoutEnlargement: true })
        .toFormat('webp') // webp is fine for both generally
        .webp({ quality: 75 })
        .toBuffer();
};

const compressTrainerPhoto = async (buffer) => {
    return await sharp(buffer)
        .resize(800, 800, { fit: 'cover', position: 'top' })
        .toFormat('webp')
        .webp({ quality: 82 })
        .toBuffer();
};

const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: folder, 
                resource_type: 'image', 
                unique_filename: true 
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );
        uploadStream.end(buffer);
    });
};

const deleteFromCloudinary = async (public_id) => {
    if (!public_id) return;
    try {
        await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        console.error("Cloudinary Delete Error:", error);
    }
};

module.exports = {
    compressProfileImage,
    compressPaymentScreenshot,
    compressTrainerPhoto,
    uploadToCloudinary,
    deleteFromCloudinary
};
