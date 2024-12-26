import { v2 as cloudinary } from 'cloudinary';

const getPublicIdFromUrl = (url: string) => {
    const parts = url.split('/');
    const publicId = parts.slice(-3).join('/').split('.')[0];
    return publicId;
};
class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET_KEY
        });
    }

    async uploadImages(images: { buffer: Buffer } | { buffer: Buffer }[], folder: string): Promise<string[]> {
        try {
            // Ensure images is always an array
            const uploadImages = Array.isArray(images) ? images : [images];
            
            const uploadPromises = uploadImages.map(image =>
                new Promise<string>((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder },
                        (error, result) => {
                            if (error) return reject(error);
                            if (result && result.secure_url) {
                                resolve(result.secure_url);
                            } else {
                                reject(new Error('Failed to get secure_url from Cloudinary'));
                            }
                        }
                    );
                    uploadStream.end(image.buffer);
                })
            );

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('Failed to upload images:', error);
            throw error;
        }
    }
    async deleteImage(url: string): Promise<void> {
        try {
            const publicId = `${getPublicIdFromUrl(url)}`
            const result = await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw error;
        }
    }
}

export default new CloudinaryService();
