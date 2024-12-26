import multer, {FileFilterCallback} from 'multer';
import {Request} from 'express';

class Multer {
    private fileFilter = (req: Request, files: Express.Multer.File | Express.Multer.File[], cb: FileFilterCallback): void => {
        const fileTypes = /jpeg|jpg|png|gif/;
        if (Array.isArray(files)) {
            files?.forEach(file => {
                const extname = fileTypes.test(file.mimetype)
                if (!extname) {
                    return cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'));
                }
            })
        } else {
            const extname = fileTypes.test(files.mimetype);
            if (!extname) {
                return cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'));
            }
        }
        cb(null, true); // Accept the file
    };

    private upload = multer({
        limits: {fileSize: 5 * 1024 * 1024}, // 5MB file size limit
        storage: multer.memoryStorage(),
        fileFilter: this.fileFilter, // Use the file filter method
    });

    public getUpload() {
        return this.upload;
    }
}

export default new Multer();
