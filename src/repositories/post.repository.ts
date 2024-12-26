import Post, { IPost } from "../models/post";
import { ORDER_STATUS, POST_STATUS } from "../utils/enum";
import _, { isSafeInteger } from "lodash";
import { DEFAULT_GET_QUERY } from "../utils/constants";
import { Types } from "mongoose";

const { ObjectId } = Types;

interface IFilterQuery {
    search?: string;
    page?: number | string;
    column?: string;
    sort_order: any;
}

class PostRepo {
    async getAllPostsByUserId(
        userId: string,
        status: string | undefined = POST_STATUS.APPROVED,
        isForVisibility: boolean = false
    ) {
        try {
            if (isForVisibility) {
                return Post.aggregate([
                    {$match: {poster_id: new ObjectId(userId)}},
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    { $unwind: "$product" },
                    {
                        $lookup: {
                            from: "users",
                            localField: "poster_id",
                            foreignField: "_id",
                            as: "poster",
                        },
                    },
                    { $unwind: "$poster" },
                    {
                        $match: {
                            "product.is_deleted": false,
                            "poster.is_deleted": false,
                            status,
                            is_deleted: false,
                        },
                    },
                ]);
            }
            return Post.find({ poster_id: new ObjectId(userId) });
        } catch (err) {
            throw err;
        }
    }

    async getAllPostsForAdmin({
        search_key,
        status,
        page = 1,
        column = "createdAt",
        sort_order = -1,
    }: any) {
        try {
            const searchFilter = search_key
                ? {
                      $or: [
                          { title: { $regex: search_key, $options: "i" } },
                          {
                              "poster.firstname": {
                                  $regex: search_key,
                                  $options: "i",
                              },
                          },
                          {
                              "poster.lastname": {
                                  $regex: search_key,
                                  $options: "i",
                              },
                          },
                          {
                              "poster.phone": {
                                  $regex: search_key,
                                  $options: "i",
                              },
                          },
                          {
                              "poster.email": {
                                  $regex: search_key,
                                  $options: "i",
                              },
                          },
                      ],
                  }
                : {};
            let sortOrder = DEFAULT_GET_QUERY.SORT_ORDER;
            try {
                if (sort_order !== undefined) {
                    const order = Number(sort_order);
                    if (isSafeInteger(order) && order >= -1 && order <= 1) {
                        sortOrder =
                            order === 0 ? DEFAULT_GET_QUERY.SORT_ORDER : order;
                    }
                }
            } catch (e) {
                sortOrder = DEFAULT_GET_QUERY.SORT_ORDER;
            }

            const commonQuery = [
                {
                    $match: {
                        $and: [
                            { status: { $ne: POST_STATUS.DRAFT } },
                            { status: { $ne: POST_STATUS.DONE } },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "product_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $lookup: {
                        from: "users",
                        localField: "poster_id",
                        foreignField: "_id",
                        as: "poster",
                    },
                },
                { $unwind: "$poster" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "product.category_id",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $unwind: "$category" },
            ];

            const [total, posts] = await Promise.all([
                Post.aggregate([...commonQuery, { $count: "total" }]),
                Post.aggregate([
                    ...commonQuery,
                    {
                        $match: {
                            ...searchFilter,
                            ...(status ? { status } : {}),
                        },
                    },
                    { $skip: (page - 1) * DEFAULT_GET_QUERY.PAGE_SIZE },
                    { $limit: DEFAULT_GET_QUERY.PAGE_SIZE },
                    { $sort: { [column]: sortOrder as any } },
                    {
                        $project: {
                            __v: 0,
                            "product.__v": 0,
                            "poster.password": 0,
                            "poster.__v": 0,
                        },
                    },
                ]),
            ]);

            return {
                total: total?.length > 0 ? total[0].total : 0,
                posts,
            };
        } catch (err) {
            throw err;
        }
    }

    async getAllApprovedPosts({
        search_key,
        city,
        category_ids,
        price_from,
        price_to,
        condition,
        page = 1,
        column = "createdAt",
        sort_order = -1,
    }: any) {
        try {
            const searchFilter = search_key
                ? { title: { $regex: search_key, $options: "i" } }
                : {};
            let priceFilter = {};
            if (price_from === "none" && price_to === "none") {
                priceFilter = { "product.price": null };
            } else if (
                price_from &&
                price_to &&
                Number(price_from) <= Number(price_to)
            ) {
                priceFilter = {
                    $and: [
                        { "product.price": { $gte: Number(price_from) } },
                        { "product.price": { $lte: Number(price_to) } },
                    ],
                };
            }
            const categoryIds =
                typeof category_ids === "string"
                    ? [new ObjectId(category_ids)]
                    : category_ids?.map((item: string) => new ObjectId(item));
            const conditions =
                typeof condition === "string" ? [condition] : condition;
            let sortOrder = DEFAULT_GET_QUERY.SORT_ORDER;
            try {
                if (sort_order !== undefined) {
                    const order = Number(sort_order);
                    if (isSafeInteger(order) && order >= -1 && order <= 1) {
                        sortOrder =
                            order === 0 ? DEFAULT_GET_QUERY.SORT_ORDER : order;
                    }
                }
            } catch (e) {
                sortOrder = DEFAULT_GET_QUERY.SORT_ORDER;
            }

            const commonQuery = [
                {
                    $lookup: {
                        from: "products",
                        localField: "product_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $lookup: {
                        from: "users",
                        localField: "poster_id",
                        foreignField: "_id",
                        as: "poster",
                    },
                },
                {
                    $lookup: {
                        from: "orders",
                        localField: "_id",
                        foreignField: "post_id",
                        as: "orders",
                    },
                },
                {
                    $addFields: {
                        hasNonCancelOrder: {
                            $cond: {
                                if: {
                                    $gt: [{ $size: "$orders" }, 0],
                                },
                                then: {
                                    $anyElementTrue: {
                                        $map: {
                                            input: "$orders",
                                            as: "order",
                                            in: { $ne: ["$$order.status", ORDER_STATUS.CANCELLED] },
                                        },
                                    },
                                },
                                else: false,
                            },
                        },
                    },
                },
                {
                    $match: {
                        hasNonCancelOrder: false,
                    },
                },
                { $unwind: "$poster" },
                {
                    $match: {
                        "product.is_deleted": false,
                        "poster.is_deleted": false,
                        status: POST_STATUS.APPROVED,
                        is_deleted: false,
                    },
                },
            ];

            const [total, posts] = await Promise.all([
                Post.aggregate([...commonQuery, { $count: "total" }]),
                Post.aggregate([
                    ...commonQuery,
                    {
                        $match: {
                            ...searchFilter,
                            ...priceFilter,
                            ...(city ? { "location.city": city } : {}),
                            ...(condition
                                ? { "product.condition": { $in: conditions } }
                                : {}),
                            ...(category_ids
                                ? {
                                      "product.category_id": {
                                          $in: categoryIds,
                                      },
                                  }
                                : {}),
                        },
                    },
                    { $skip: (page - 1) * DEFAULT_GET_QUERY.PAGE_SIZE },
                    { $limit: DEFAULT_GET_QUERY.PAGE_SIZE },
                    { $sort: { [column]: sortOrder as any } },
                    {
                        $project: {
                            __v: 0,
                            "product.__v": 0,
                            "product.is_deleted": 0,
                            "poster.password": 0,
                            "poster.is_deleted": 0,
                            "poster.__v": 0,
                        },
                    },
                ]),
            ]);

            return {
                total: total?.length > 0 ? total[0].total : 0,
                posts,
            };
        } catch (err) {
            throw err;
        }
    }

    async getAllMyPosts(
        posterId: string,
        status: string,
        { search, page, column, sort_order }: IFilterQuery
    ): Promise<any> {
        try {
            let searchQuery = search
                ? { title: { $regex: search, $options: "i" } }
                : {};
            const currentPage: number =
                _.isNaN(page) || Number(page) <= 0 || !page
                    ? DEFAULT_GET_QUERY.PAGE
                    : Number(page);
            const pageSize: number = DEFAULT_GET_QUERY.PAGE_SIZE;
            const sortColumn = column || DEFAULT_GET_QUERY.COLUMN;
            const sortOrder = sort_order ? Number(sort_order) : -1;
            const [total, posts] = await Promise.all([
                Post.countDocuments({ poster_id: posterId, is_deleted: false }),
                Post.aggregate([
                    {
                        $match: {
                            ...searchQuery,
                            poster_id: posterId,
                            is_deleted: false,
                            status,
                        },
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "product_id",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    {
                        $unwind: {
                            path: "$product",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $lookup: {
                            from: "orders",
                            localField: "_id",
                            foreignField: "post_id",
                            as: "orders",
                        },
                    },
                    {
                        $addFields: {
                            hasNonCancelOrder: {
                                $cond: {
                                    if: {
                                        $gt: [{ $size: "$orders" }, 0],
                                    },
                                    then: {
                                        $anyElementTrue: {
                                            $map: {
                                                input: "$orders",
                                                as: "order",
                                                in: { $ne: ["$$order.status", ORDER_STATUS.CANCELLED] },
                                            },
                                        },
                                    },
                                    else: false,
                                },
                            },
                        },
                    },
                    {
                        $match: {
                            hasNonCancelOrder: false,
                        },
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "product.category_id",
                            foreignField: "_id",
                            as: "category",
                        },
                    },
                    {
                        $unwind: {
                            path: "$category",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    { $sort: { [sortColumn]: sortOrder as any } },
                    { $skip: pageSize * (currentPage - 1) },
                    { $limit: pageSize },
                    {
                        $project: {
                            "category.is_deleted": 0,
                            "category.__v": 0,
                            "product.is_deleted": 0,
                            "product.__v": 0,
                            is_deleted: 0,
                            __v: 0,
                        },
                    },
                ]),
            ]);
            return { total, posts };
        } catch (err) {
            throw err;
        }
    }

    async getPost(postId: string): Promise<any> {
        try {
            return Post.findOne({
                _id: new ObjectId(postId),
                is_deleted: false,
                status: { $ne: POST_STATUS.DONE },
            }).lean();
        } catch (err) {
            throw err;
        }
    }

    async createPost(isValidate: boolean, post: Partial<IPost>): Promise<any> {
        try {
            const newPost = new Post(post);
            const result = await newPost.save({
                validateBeforeSave: isValidate,
            });

            return result ? result : false;
        } catch (err) {
            throw err;
        }
    }

    async updatePost(postId: string, post: Partial<IPost>): Promise<boolean> {
        try {
            const result = await Post.findByIdAndUpdate(postId, post);
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async deletePost(postId: string, post: Partial<IPost>): Promise<boolean> {
        try {
            const result = await Post.findByIdAndUpdate(postId, {
                is_deleted: true,
            });
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async deletePostsByUserId(userId: string): Promise<void> {
        try {
            await Post.updateMany({
                poster_id: new ObjectId(userId),
                is_deleted: true,
            });
        } catch (err) {
            throw err;
        }
    }

    async restorePostsByUserId(userId: string): Promise<void> {
        try {
            await Post.updateMany({
                poster_id: new ObjectId(userId),
                is_deleted: false,
            });
        } catch (err) {
            throw err;
        }
    }

    async restorePost(postId: string, post: Partial<IPost>): Promise<boolean> {
        try {
            const result = await Post.findByIdAndUpdate(postId, {
                is_deleted: false,
            });
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async hideOrShowPost(
        postId: string,
        isVisibility: boolean
    ): Promise<boolean> {
        try {
            const result = await Post.findByIdAndUpdate(postId, {
                status: isVisibility
                    ? POST_STATUS.APPROVED
                    : POST_STATUS.HIDDEN,
            });
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }
}

export default new PostRepo();
