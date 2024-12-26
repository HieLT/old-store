import { Request, Response } from "express";
import CloudinaryService from "../services/cloudinary";
import UserRepo from "../repositories/user.repository";
import validatePassword from "../utils/validatePassword";
import user, { IUser } from "../models/user";
import { isValidObjectId, Types } from "mongoose";
import userRepository from "../repositories/user.repository";

const { ObjectId } = Types;

interface CustomRequest extends Request {
    account?: any;
}

class UserController {
    async getProfile(req: CustomRequest, res: Response): Promise<void> {
        try {
            const user = req.account;
            res.status(200).send(await UserRepo.getUserById(user._id));
        } catch {
            res.status(500).send();
        }
    }

    async getUserProfile(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            if (!id || !isValidObjectId(id)) {
                return res
                    .status(400)
                    .send({ message: "ID người dùng không hợp lệ" });
            }
            const userProfile = await user.findOne({
                _id: new ObjectId(id),
                is_deleted: false,
            });
            if (!userProfile) {
                return res.status(404).send({
                    message: "Tài khoản không tồn tại hoặc đã bị khóa",
                });
            }
            res.status(200).send(await UserRepo.getUserById(id));
        } catch {
            res.status(500).send();
        }
    }

    async searchUser(req: Request, res: Response): Promise<void> {
        try {
            const { searchKey, page, limit } = req.body;
            const users = await UserRepo.searchUser(searchKey, page, limit);
            res.status(200).send(users);
        } catch {
            res.status(500).send();
        }
    }

    async updateUser(req: CustomRequest, res: Response): Promise<void> {
        try {
            const update = req.body;
            const user = req.account as IUser;

            if (update.password && !validatePassword(update.password)) {
                res.status(400).send("Mật khẩu không đáp ứng yêu cầu");
                return;
            }

            if ("is_deleted" in update) {
                res.status(403).send("Không có quyền cập nhật");
                return;
            }

            const result = await UserRepo.updateUser(String(user._id), update);

            result
                ? res.status(200).send("Cập nhật user thành công")
                : res.status(400).send("Cập nhật thất bại");
        } catch (error) {
            res.status(500).send();
        }
    }

    async updateAvatar(req: CustomRequest, res: Response): Promise<void> {
        try {
            const user = req.account as IUser;
            const file = req.file;
            if (!file) {
                res.status(400).send("Không có ảnh upload");
                return;
            }
            if (user.avatar) CloudinaryService.deleteImage(user.avatar);

            const uploadImage = { buffer: file.buffer };

            const uploadResults = await CloudinaryService.uploadImages(
                uploadImage,
                "Old_store/user"
            );
            const avatarUrl = uploadResults[0];
            await UserRepo.updateUser(String(user._id), { avatar: avatarUrl });

            res.status(200).send("Upload ảnh thành công");
        } catch {
            res.status(500).send();
        }
    }

    async followUser(req: CustomRequest, res: Response): Promise<any> {
        try {
            const user = req.account as IUser;
            const { userId } = req.body;
            if (!userId || !isValidObjectId(userId)) {
                return res.status(400).send("ID người dùng không hợp lệ");
            }
            const followedUser = await userRepository.getUserById(userId);
            if (!followedUser) {
                return res
                    .status(404)
                    .send(
                        "Tài khoản bạn theo dõi không tồn tại hoặc đã bị khóa"
                    );
            }
            if (user?.following_user_ids?.includes(userId)) {
                return res
                    .status(400)
                    .send("Bạn đã theo dõi tài khoản này trước đó");
            }
            await userRepository.followOrUnfollowUserByUserId(
                String(user?._id),
                userId
            );
            return res.status(200).send("Theo dõi người dùng thành công");
        } catch {
            res.status(500).send();
        }
    }

    async unfollowUser(req: CustomRequest, res: Response): Promise<any> {
        try {
            const user = req.account as IUser;
            const { userId } = req.body;
            if (!userId || !isValidObjectId(userId)) {
                return res.status(400).send("ID người dùng không hợp lệ");
            }
            const followedUser = await userRepository.getUserById(userId);
            if (!followedUser) {
                return res
                    .status(404)
                    .send(
                        "Tài khoản bạn theo dõi không tồn tại hoặc đã bị khóa"
                    );
            }
            if (!user?.following_user_ids?.includes(userId)) {
                return res
                    .status(400)
                    .send("Bạn chưa từng theo dõi tài khoản này");
            }
            await userRepository.followOrUnfollowUserByUserId(
                String(user?._id),
                userId,
                "unfollow"
            );
            return res.status(200).send("Theo dõi người dùng thành công");
        } catch {
            res.status(500).send();
        }
    }
}

export default new UserController();
