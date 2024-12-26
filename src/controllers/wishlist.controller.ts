import {Request, Response} from "express";
import User, {IUser} from '../models/user';
import {isValidObjectId, Schema, Types} from "mongoose";
import PostRepository from "../repositories/post.repository";
import Post from "../models/post";
import { POST_STATUS } from "../utils/enum";

const {ObjectId} = Types

interface CustomRequest extends Request {
    account?: any;
}

interface AddToWishlistRequest extends CustomRequest {
    postId?: string;
}

class WishlistController {
    async getMyWishlist(req: CustomRequest, res: Response): Promise<any> {
        try {
            const user = req.account as IUser;
            const wishlist = await Post.aggregate([
                {$match: {_id: {$in: user.wishlist}}},
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'poster_id',
                        foreignField: '_id',
                        as: 'poster'
                    }
                },
                {$unwind: '$product'},
                {$unwind: '$poster'},
                {$match: {'poster.is_deleted': false}},
                {$project: {
                    'poster.is_deleted': 0,
                    'poster.password': 0
                }}
            ])
            return res.status(200).send({wishlist});
        } catch {
            return res.status(500).send({message: 'Lỗi máy chủ'});
        }
    }

    async addToWishlist(req: AddToWishlistRequest, res: Response): Promise<any> {
        try {
            const user = req.account as IUser;
            const {postId} = req.body

            if (!postId || !isValidObjectId(postId)) {
                return res.status(400).send({message: 'ID bài đăng không hợp lệ'})
            }
            const post = await PostRepository.getPost(postId)
            if (!post) {
                return res.status(404).send({message: 'Bài đăng không tồn tại'})
            }
            if (post?.status !== POST_STATUS.APPROVED) {
                return res.status(400).send({message: 'Bài đăng đang không được hiển thị'})
            }
            if (user?.wishlist?.map(item => String(item))?.includes(postId)) {
                return res.status(400).send({message: 'Bạn đã yêu thích bài đăng trước đó'})
            }
            await User.findOneAndUpdate({_id: user?._id}, {$set: {wishlist: [...user.wishlist, postId]}})
            return res.status(200).send({message: 'Thêm bài đăng vào danh sách yêu thích thành công'})
        } catch {
            return res.status(500).send({message: 'Lỗi máy chủ'});
        }
    }

    async removeFromWishlist(req: CustomRequest, res: Response): Promise<any> {
        try {
            const user = req.account as IUser;
            const {id} = req.params

            if (!id || !isValidObjectId(id)) {
                return res.status(400).send({message: 'ID bài đăng không hợp lệ'})
            }
            const isExistInWishlist: boolean = user.wishlist?.map((item: Schema.Types.ObjectId) => String(item))?.includes(id)
            if (!isExistInWishlist) {
                return res.status(404).send({message: 'Bài đăng không tồn tại trong danh sách yêu thích'})
            }
            await User.findOneAndUpdate(
                {_id: user?._id},
                {$set: {wishlist: user.wishlist?.filter(postId => String(postId) !== id)}}
            )
            return res.status(200).send({message: 'Xóa bài đăng vào danh sách yêu thích thành công'})
        } catch {
            return res.status(500).send({message: 'Lỗi máy chủ'});
        }
    }
}

export default new WishlistController;
