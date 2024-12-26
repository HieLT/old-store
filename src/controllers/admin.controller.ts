import path from 'path';
import { Request, Response } from "express";
import CloudinaryService from '../services/cloudinary';
import AdminRepo from '../repositories/admin.repository';
import UserRepo from '../repositories/user.repository';
import validatePassword from '../utils/validatePassword';
import { IAdmin } from '../models/admin';
import postRepository from '../repositories/post.repository';
import productRepository from '../repositories/product.repository';
import attribute_productRepository from '../repositories/attribute_product.repository';
import OrderRepo from '../repositories/order.repository';

interface MulterRequest extends Request {
    files: Express.Multer.File[];
}
interface CustomRequest extends Request {
    account?: any;
}


class AdminController {
    async getProfile(req: CustomRequest, res: Response): Promise<void> {
        try {
            const account = req.account as IAdmin;
            res.status(200).send(account);
        } catch(err) {
            res.status(400).send(err);
        }
    }

    async searchAdmin(req: Request, res: Response): Promise<void> {
        try {
            const { keywords, page, limit } = req.params;
            const admins = await AdminRepo.searchAdmin(keywords, Number(page), Number(limit));
            res.status(200).send(admins);
        } catch(err) {
            res.status(400).send(err);
        }
    }

    async searchUser(req: Request, res: Response): Promise<void> {
        try {
            const { keywords, page, limit } = req.query as any;
            const users = await UserRepo.searchUser(keywords, Number(page), Number(limit));
            res.status(200).send(users);
        } catch(err) {
            res.status(400).send(err);
        }
    }

    async updateAdmin(req: CustomRequest, res: Response): Promise<void> {
        try {
            const admin = req.body.admin;
            const account = req.account;
            if (account.password && !validatePassword(account.password)) {
                res.status(400).send('Mật khẩu không đáp ứng yêu cầu');
                return;
            }
            if ('is_deleted' in admin) {
                res.status(403).send('Không có quyền truy cập');
            }
            const result = await AdminRepo.updateAdmin(admin._id, admin);

            result ? res.status(200).send('Cập nhật thành công') : res.status(400).send('Cập nhật thất bại');

        } catch(err) {
            res.status(400).send(err);
        }
    }

    async updateAvatar(req: CustomRequest, res: Response): Promise<void> {
        try {
            const multerReq = req as MulterRequest;
            const account = req.account;
            const files = multerReq.files;

            if (files.length > 0) {
                const oldUrl = account.avatar;
                if (oldUrl) CloudinaryService.deleteImage(oldUrl);

                const images = files.map(file => {
                    const baseName = path.basename(file.originalname, path.extname(file.originalname));
                    return {
                        buffer: file.buffer,
                        originalname: baseName
                    };
                });

                CloudinaryService.uploadImages(images, 'Old_store/user').then(uploadResults => {
                    const avatarUrl = uploadResults[0];
                    AdminRepo.updateAdmin(account._id, { avatar: avatarUrl }).catch(error => {
                        console.error(error);
                    });
                }).catch(error => {
                    console.error(error);
                });

                res.status(200).send('Cập nhật thành công, đang xử lý ảnh...');
            } else {
                res.status(400).send('Không có ảnh upload');
            }
        } catch(err){
            res.status(400).send(err);
        }

    }

    async createAdmin(req: Request, res: Response): Promise<void> {
        try {
            const admin = req.body.admin;

            if (!admin.password || !validatePassword(admin.password)) {
                res.status(400).send('Mật khẩu không đáp ứng yêu cầu');
                return;
            }

            const adminExisted = await AdminRepo.getAdminByUsername(admin.user_name);

            if (adminExisted.Existed) {
                res.status(400).send('Người dùng đã tồn tại');
                return;
            }

            const result = await AdminRepo.createAdmin(admin);
            result ? res.status(201).send('Thêm mới admin thành công')
                : res.status(400).send('Tạo mới admin không thành công');
        } catch(err) {
            res.status(400).send(err);
        }
    }

    async deleteAdmin(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;

            const result = await AdminRepo.deleteAdmin(id);

            result ? res.status(200).send('Thành công') : res.status(400).send('Xóa tài khoản không thành công');
        } catch(err) {
            res.send(400).send(err);
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            if (await OrderRepo.userIsOrdering(id)) {
                res.status(400).send('Bạn không thể xóa user này, user đang trong quá trình nhận đơn hàng');
                return;
            }
            await Promise.all([
                UserRepo.deleteUser(id),
                postRepository.deletePostsByUserId(id),
                productRepository.deleteProductsByPostId(id),
                attribute_productRepository.deleteAttributeProductByUserId(id)
            ])

            res.status(200).send('Thành công');
        } catch(err) {
            res.send(400).send(err);
        }
    }

    async restoreAdmin(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;

            const result = await AdminRepo.restoreAdmin(id);

            result ? res.status(200).send('Thành công') : res.status(400).send('Khôi phục thất bại');
        } catch(err) {
            res.send(400).send(err);
        }
    }

    async restoreUser(req: Request, res: Response): Promise<void> {
        try {
            const id= req.params.id;

            await Promise.all([
                UserRepo.restoreUser(id),
                postRepository.restorePostsByUserId(id),
                productRepository.restoreProductsByPostId(id),
                attribute_productRepository.restoreAttributeProductByUserId(id)
            ])

            res.status(200).send('Thành công')
        } catch(err) {
            res.send(400).send(err);
        }
    }
}

export default new AdminController;
