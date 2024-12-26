import User, { IUser } from "../models/user";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import order from "../models/order";
import { ORDER_STATUS } from "../utils/enum";

const { ObjectId } = Types;

class UserRepo {
    async getUserById(id: string): Promise<any> {
        try {
            const user = await User.aggregate([
                { $match: { _id: new ObjectId(id), is_deleted: false } },
                {
                    $lookup: {
                        from: "ratings",
                        localField: "_id",
                        foreignField: "reviewee_id",
                        as: "reviewers",
                    },
                },
                {
                    $addFields: {
                        reviewers: {
                            $filter: {
                                input: "$reviewers",
                                as: "reviewer",
                                cond: {
                                    $eq: [
                                        "$$reviewer.reviewee_id",
                                        new ObjectId(id),
                                    ],
                                },
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        averageStars: {
                            $ifNull: [{ $avg: "$reviewers.stars" }, 0],
                        },
                    },
                },
                {
                    $project: {
                        password: 0,
                        is_deleted: 0,
                    },
                },
            ]);
            return user ? user?.[0] : null;
        } catch (err) {
            throw err;
        }
    }

    async getUserByEmail(email: any): Promise<any> {
        try {
            const user = await User.findOne({ email });
            return user;
        } catch (err) {
            throw err;
        }
    }

    async searchUser(
        searchKey: string,
        page: number = 1,
        limit: number = 10
    ): Promise<any> {
        try {
            let searchQuery = {};
            if (searchKey) {
                searchQuery = {
                    $or: [
                        { firstname: { $regex: searchKey, $options: "i" } },
                        { lastname: { $regex: searchKey, $options: "i" } },
                        { email: { $regex: searchKey, $options: "i" } },
                        { phone: { $regex: searchKey, $options: "i" } },
                    ],
                };
            }
            const users = await User.find(searchQuery)
                .skip((page - 1) * limit)
                .limit(limit) // Limit number of documents per page
                .exec();

            const total = await User.countDocuments(searchQuery);
            return { users, total };
        } catch (err) {
            throw err;
        }
    }

    async createUser(user: Partial<IUser>): Promise<boolean> {
        try {
            const create: Partial<IUser> = { ...user };

            if (user.password) {
                create.password = bcrypt.hashSync(user.password, 10);
            } else {
                create.password = null;
            }

            const result = await User.create(create);

            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async updateUser(id: string, user: Partial<IUser>): Promise<boolean> {
        try {
            const update: Partial<IUser> = { ...user };

            if (user.password)
                update.password = bcrypt.hashSync(user.password, 10);

            const result = await User.findOneAndUpdate({ _id: id }, update);

            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async deleteUser(id: string): Promise<boolean> {
        try {
            const statusCondition = {
                status: {
                    $nin: [
                        ORDER_STATUS.CANCELLED,
                        ORDER_STATUS.RECEIVED,
                        ORDER_STATUS.DELIVERED,
                    ],
                },
            };
            const [isCustomerInAnOrder, isPosterInAnOrder] = await Promise.all([
                order.findOne({
                    customer_id: new ObjectId(id),
                    is_deleted: false,
                    ...statusCondition,
                }),
                order.aggregate([
                    {
                        $lookup: {
                            from: "posts",
                            localField: "post_id",
                            foreignField: "_id",
                            as: "post",
                        },
                    },
                    {
                        $match: {
                            is_deleted: false,
                            ...statusCondition,
                            "post.poster_id": new ObjectId(id),
                        },
                    },
                ]),
            ]);

            if (isCustomerInAnOrder || isPosterInAnOrder?.length > 0) {
                throw Error("Người dùng đang có đơn hàng chưa được hoàn thành");
            }

            const result = await User.findByIdAndUpdate(
                { _id: id },
                { is_deleted: true }
            );

            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async restoreUser(id: string): Promise<boolean> {
        try {
            const result = await User.findByIdAndUpdate(
                { _id: id },
                { is_deleted: false }
            );

            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async followOrUnfollowUserByUserId(
        followerId: string,
        followedUserId: string,
        type: string = "follow"
    ): Promise<void> {
        try {
            if (type === "follow") {
                await Promise.all([
                    User.findByIdAndUpdate(
                        { _id: new ObjectId(followedUserId) },
                        {
                            $addToSet: {
                                follower_ids: followerId,
                            },
                        }
                    ),
                    User.findByIdAndUpdate(
                        { _id: new ObjectId(followerId) },
                        {
                            $addToSet: {
                                following_user_ids: followedUserId,
                            },
                        }
                    ),
                ]);
            } else {
                await Promise.all([
                    User.findByIdAndUpdate(
                        { _id: new ObjectId(followedUserId) },
                        {
                            $pull: {
                                follower_ids: followerId,
                            },
                        }
                    ),
                    User.findByIdAndUpdate(
                        { _id: new ObjectId(followerId) },
                        {
                            $pull: {
                                following_user_ids: followedUserId,
                            },
                        }
                    ),
                ]);
            }
        } catch (err) {
            throw err;
        }
    }
}
export default new UserRepo();
