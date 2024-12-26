import { Request, Response } from "express";
import { IUser } from "../models/user";
import { isValidObjectId } from "mongoose";
import ratingRepository from "../repositories/rating.repository";

interface CustomRequest extends Request {
    account?: any;
}

class RatingController {
    async getPosterRatings(req: CustomRequest, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            if (!id || !isValidObjectId(id)) {
                return res
                    .status(400)
                    .send({ message: "ID người dùng không hợp lệ" });
            }
            const ratings = await ratingRepository.getRatingsByUserId(id);

            return res.status(200).send({ ratings });
        } catch (err) {
            return res.status(400).send(err);
        }
    }

    async rateUser(req: CustomRequest, res: Response): Promise<any> {
        try {
            const account = req.account
            const { revieweeId, star, comment } = req.body.rating;
            if (!revieweeId || !isValidObjectId(revieweeId)) {
                return res
                    .status(400)
                    .send({ message: "ID người dùng không hợp lệ" });
            }
            await ratingRepository.rateUser(String(account?._id), revieweeId, star, comment);
            return res.status(200).send('Đánh giá thành công');
        } catch (err: any) {
            return res.status(400).send(err);
        }
    }

    async deleteRating(req: CustomRequest, res: Response): Promise<any> {
        try {
            const account = req?.account;
            const {id} = req.params;
            if (!id || !isValidObjectId(id)) {
                return res
                    .status(400)
                    .send({ message: "ID đánh giá không hợp lệ" });
            }
            await ratingRepository.deleteRating(String(account?._id), id);
            return res.status(200).send('Xóa đánh giá thành công');
        } catch (err) {
            return res.status(400).send(err);
        }
    }
}

export default new RatingController();
