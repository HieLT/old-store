import { Request, Response } from "express";
import ProductRepo from "../repositories/product.repository";
import productRepository from "../repositories/product.repository";
import AttributeRepo from "../repositories/attribute.repository";
import AttributeProductRepo from "../repositories/attribute_product.repository";
import PostRepo from "../repositories/post.repository";
import postRepository from "../repositories/post.repository";
import CloudinaryService from "../services/cloudinary";
import { IAttribute } from "../models/attribute";
import { IAttributeProduct } from "../models/attribute_product";
import mongoose, { isValidObjectId, Types } from "mongoose";
import { formatExpiredDate, getDetailErrorMessage, getOneMonthLater } from "../utils/helpers";
import { updatePostSchema } from "../requests/post.request";
import { NOTIFICATION_TYPE, POST_STATUS } from "../utils/enum";
import { DEFAULT_GET_QUERY } from "../utils/constants";
import User from "../models/user";
import notificationRepository from "../repositories/notification.repository";
import NotificationRepo from '../repositories/notification.repository';
import { IPost } from "../models/post";
import orderRepo from "../repositories/order.repository";

const { ObjectId } = Types;

interface CustomRequest extends Request {
    io?: any;
    account?: any;
}

async function getMissingAttributesRequired(
    productAttributes: any[],
    categoryId: string
): Promise<any> {
    const requiredAttributes = await AttributeRepo.getAttributesRequired(
        categoryId
    );
    const requestAttributeIds = productAttributes?.map((item) =>
        String(item?.attribute_id)
    );
    let missingCount: IAttribute[] = [];

    requiredAttributes?.forEach((item: IAttribute) => {
        const existAttributeId = requestAttributeIds?.find(
            (id) => id === String(item?._id)
        );
        const attribute = productAttributes?.find(
            (requestAttr: any) =>
                String(requestAttr.attribute_id) === existAttributeId
        );
        if (!attribute || (!attribute?.value && attribute.value !== 0)) {
            missingCount = [...missingCount, item];
        }
    });
    return missingCount;
}

async function getAttributesLeft(
    productAttributes: any[],
    categoryId: string
): Promise<any> {
    const allAttributes = await AttributeRepo.getAttributes(categoryId);
    const attributeIds = allAttributes.map((item: IAttribute) => item._id);
    const idAttributeInput = productAttributes.map((item) =>
        String(item.attribute_id)
    );

    return attributeIds.filter(
        (item: any) => !idAttributeInput?.includes(String(item))
    );
}

const handleCheckObjectArrayType = (arr: any): void => {
    if (!Array.isArray(arr)) {
        throw new Error(
            "Thuộc tính product_attributes phải là một mảng chứa các đối tượng key-value."
        );
    }
    if (arr?.length > 0) {
        arr.forEach((item: any) => {
            if (!("attribute_id" in item) || !("value" in item)) {
                throw new Error(
                    "Thuộc tính product_attributes phải là một mảng chứa các đối tượng key-value."
                );
            }
        });
    }
};

class PostController {
    async getAllPosts(req: Request, res: Response): Promise<any> {
        try {
            const result = await postRepository.getAllApprovedPosts(req.query);
            return res.status(200).send(result);
        } catch (err) {
            return res.status(500).send({ message: "Lỗi máy chủ" });
        }
    }

    async getPostsByUserId(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.params;
            const { status } = req.query;
            const result = await postRepository.getAllPostsByUserId(
                id as string,
                status as string,
                true
            );
            return res.status(200).send(result);
        } catch (err) {
            return res.status(500).send({ message: "Lỗi máy chủ" });
        }
    }

    async getAllPostsForAdmin(req: Request, res: Response): Promise<any> {
        try {
            const result = await postRepository.getAllPostsForAdmin(req.query);
            return res.status(200).send(result);
        } catch (err) {
            return res.status(500).send({ message: "Lỗi máy chủ" });
        }
    }

    async getPostById(req: CustomRequest, res: Response): Promise<any> {
        try {
            const postId: string = req.params.id;
            const accountId = req.account?._id;
            if (!postId || !isValidObjectId(postId)) {
                return res
                    .status(400)
                    .send({ message: "ID bài đăng không hợp lệ" });
            }
            let post = await postRepository.getPost(postId);
            if (!post) {
                return res
                    .status(404)
                    .send({ message: "Bài đăng không tồn tại hoặc đã bị xóa" });
            }
            const isEditable = String(accountId) === String(post?.poster_id);
            const [postProduct, poster] = await Promise.all([
                productRepository.getProduct(String(post?.product_id)),
                User.aggregate([
                    {
                        $match: {
                            _id: new ObjectId(post?.poster_id),
                            is_deleted: false,
                        },
                    },
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
                                            new ObjectId(post?.poster_id),
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
                ]),
            ]);
            post = !isEditable
                ? {
                      ...post,
                      product: postProduct,
                      poster: poster?.[0],
                  }
                : {
                      ...post,
                      product: postProduct,
                  };
            return res.status(200).send({
                post: post,
                editable: isEditable,
            });
        } catch (err) {
            return res.status(500).send({ message: "Lỗi máy chủ" });
        }
    }

    async createPost(req: CustomRequest, res: Response): Promise<void> {
        const session: mongoose.mongo.ClientSession =
            await mongoose.startSession();
        session.startTransaction();

        const user = req.account;
        const dataInput = req.body.post;
        const { title, location, is_draft } = dataInput;
        const {
            product_attributes,
            condition,
            images,
            category_id,
            description,
            price,
        } = dataInput.product || {};

        if (!dataInput || !dataInput.product) {
            res.status(400).send("Lỗi yêu cầu");
            return;
        }

        try {
            const createdProduct = await ProductRepo.createProduct(
                !is_draft,
                {
                    description: description,
                    price: price,
                    condition: condition,
                    images: images,
                    category_id: category_id,
                },
                session
            );

            // check object array type
            handleCheckObjectArrayType(product_attributes);

            if (!is_draft) {
                const missingAttributes = await getMissingAttributesRequired(
                    product_attributes,
                    category_id
                );

                const missingLabels = missingAttributes.map(
                    (attr: IAttribute) => attr.label
                );

                if (missingLabels.length > 0) {
                    throw new Error(
                        `Thiếu các thuộc tính bắt buộc: ${missingLabels.join(
                            ", "
                        )}`
                    );
                }
            }

            // Update productAttributes to include the productId for each attribute before create product_attribute
            const updatedAttributes = product_attributes.map(
                (attribute: IAttributeProduct) => ({
                    product_id: String(createdProduct._id),
                    attribute_id: attribute.attribute_id,
                    value: attribute.value,
                })
            );

            // Create product attributes concurrently
            await Promise.all(
                updatedAttributes.map((attribute: any) =>
                    AttributeProductRepo.createAttributeProduct(
                        !is_draft,
                        attribute,
                        session
                    )
                )
            );

            // Add remaining attributes with null values
            const attributeLeft = await getAttributesLeft(
                product_attributes ? product_attributes : [],
                category_id
            );
            const attributesLeftToCreate = attributeLeft.map(
                (attribute: IAttributeProduct) => ({
                    product_id: String(createdProduct._id),
                    attribute_id: attribute._id,
                    value: null,
                })
            );

            await Promise.all(
                attributesLeftToCreate.map((attribute: any) =>
                    AttributeProductRepo.createAttributeProduct(
                        false,
                        attribute,
                        session
                    )
                )
            );

            await PostRepo.createPost(!is_draft, {
                title: title,
                poster_id: user._id,
                product_id: createdProduct._id,
                location: location,
                status: is_draft ? "draft" : "pending"
            });

            await session.commitTransaction();

            res.status(201).send("Tạo mới thành công");
        } catch (err: any) {
            await session.abortTransaction();
            if (images?.length > 0) {
                images?.forEach((imageUrl: string) => {
                    CloudinaryService.deleteImage(imageUrl);
                });
            }
            res.status(400).send(err.message);
        } finally {
            session.endSession();
        }
    }

    async imagesUpload(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                res.status(400).send("Không có ảnh");
                return;
            }
            const uploadImages = files.map((file) => {
                return {
                    buffer: file.buffer,
                };
            });
            const uploadResults = await CloudinaryService.uploadImages(
                uploadImages,
                "old_store/product"
            );
            res.status(201).send(uploadResults);
        } catch (err: any) {
            res.status(400).send(err.message);
        }
    }

    async getOwnPost(req: CustomRequest, res: Response): Promise<void> {
        try {
            const user = req.account;
            const status = req.query.status || POST_STATUS.APPROVED;

            const result = await PostRepo.getAllMyPosts(
                user._id,
                status as string,
                {
                    search: (req.query.search as string) || undefined,
                    page: req.query.page as string,
                    column: (req.query.column as string) || "createdAt",
                    sort_order:
                        req.query.sort_order || DEFAULT_GET_QUERY.SORT_ORDER,
                }
            );
            res.status(200).send(result);
        } catch (err: any) {
            res.status(400).send(err.message);
        }
    }

    async updatePost(req: CustomRequest, res: Response): Promise<any> {
        const session: mongoose.mongo.ClientSession =
            await mongoose.startSession();
        session.startTransaction();

        const user = req.account;
        const requestPost = req.body.post;
        const {
            product_attributes,
            condition,
            images,
            category_id,
            description,
            price,
        } = requestPost.product || {};

        const { error } = updatePostSchema.body.validate(requestPost, {
            abortEarly: false,
        });
        if (error) {
            return res.status(400).send({
                message: "Lỗi yêu cầu",
                details: getDetailErrorMessage(error),
            });
        }
        const postId = req.params.id;

        try {
            if (!isValidObjectId(postId)) {
                return res.status(400).send("ID bài đăng không hợp lệ");
            }

            const post = await PostRepo.getPost(postId);
            if (!post) {
                return res
                    .status(404)
                    .send("Bài đăng không tồn tại hoặc đã bị xóa");
            }
            if (String(post.poster_id) !== String(user._id)) {
                return res
                    .status(400)
                    .send("Bạn không có quyền chỉnh sửa bài đăng này");
            }

            // check request status
            let status = POST_STATUS.PENDING;
            const currentStatus = post?.status;
            const requestStatus = requestPost?.status;
            if (
                requestStatus === POST_STATUS.PENDING &&
                (currentStatus === POST_STATUS.DRAFT ||
                    currentStatus === POST_STATUS.APPROVED ||
                    currentStatus === POST_STATUS.REJECTED ||
                    currentStatus === POST_STATUS.PENDING)
            ) {
                status = POST_STATUS.PENDING;
            } else if (
                requestStatus === POST_STATUS.DRAFT &&
                currentStatus === POST_STATUS.DRAFT
            ) {
                status = POST_STATUS.DRAFT;
            } else {
                return res.status(400).send({
                    message: "Bạn không có quyền thay đổi trạng thái bài đăng",
                });
            }

            for (const item of product_attributes) {
                const attribute = await AttributeRepo.getAttribute(
                    item?.attribute_id
                );
                if (!attribute) {
                    return res
                        .status(404)
                        .send("Tồn tại ID thuộc tính không hợp lệ");
                }
            }

            if (requestStatus !== POST_STATUS.DRAFT) {
                const missingAttributes = await getMissingAttributesRequired(
                    product_attributes,
                    category_id
                );
                const missingLabels = missingAttributes.map(
                    (attr: IAttribute) => attr.label
                );

                if (missingLabels.length > 0) {
                    throw new Error(
                        `Thiếu các thuộc tính bắt buộc: ${missingLabels.join(
                            ", "
                        )}`
                    );
                }
            }

            const updateProductResult = await ProductRepo.updateProduct(
                requestStatus !== POST_STATUS.DRAFT,
                {
                    description: description,
                    price: price,
                    condition: condition,
                    images: images,
                    category_id: category_id,
                    id: post?.product_id,
                },
                session
            );
            if (!updateProductResult) {
                throw new Error("Không tìm thấy sản phẩm thuộc bài đăng");
            }
            await Promise.all(
                product_attributes.map(
                    (item: {
                        _id: string;
                        attribute_id: string;
                        product_id: string;
                        value: any;
                    }) =>
                        AttributeProductRepo.updateAttributeProduct(
                            requestStatus !== POST_STATUS.DRAFT,
                            {
                                id: item?._id,
                                attributeId: item?.attribute_id,
                                productId: item?.product_id,
                                value: item?.value,
                            },
                            session
                        )
                )
            );

            await PostRepo.updatePost(postId, {
                ...requestPost,
                status,
            });

            await session.commitTransaction();

            res.status(200).send("Cập nhật thành công");
        } catch (err: any) {
            await session.abortTransaction();
            if (images?.length > 0) {
                images?.forEach((imageUrl: string) => {
                    CloudinaryService.deleteImage(imageUrl);
                });
            }
            res.status(400).send(err.message);
        } finally {
            session.endSession();
        }
    }

    async approvePost(req: CustomRequest, res: Response): Promise<void> {
        const { post_id } = req.params;
        try {
            const post = await PostRepo.getPost(post_id);
            if (!post) {
                res.status(404).send("Bài post không tồn tại");
                return;
            }
            if (post.status !== POST_STATUS.PENDING) {
                res.status(400).send("Bài post này không thể duyệt");
                return;
            }
            try {
                const oneMonthLater = getOneMonthLater()
                const updatedPost = !post?.expired_at ? {
                    expired_at: oneMonthLater,
                    status: POST_STATUS.APPROVED,
                } : {
                    status: POST_STATUS.APPROVED
                }
                await PostRepo.updatePost(post._id, updatedPost);
                await notificationRepository.sendNotification({
                    title: `Bài đăng của bạn đã được duyệt và sẽ hết hạn vào ${formatExpiredDate(oneMonthLater)}. Nhấn để xem chi tiết bài đăng`,
                    type: NOTIFICATION_TYPE.APPROVED_POST,
                    receiver_id: post?.poster_id,
                    post_id: post?._id,
                    order_id: null
                });
            } catch (err: any) {
                res.status(400).send(err.message);
            }
            res.status(200).send("Duyệt thành công");
        } catch {
            res.status(500).send("Lỗi server");
        }
    }

    async rejectPost(req: Request, res: Response): Promise<void> {
        const {post_id} = req.params;
        try{
            const post = await PostRepo.getPost(post_id);
            if (!post) {
                res.status(404).send("Bài post không tồn tại");
                return;
            }
            if (
                post.status !== POST_STATUS.PENDING &&
                post.status !== POST_STATUS.APPROVED &&
                post.status !== POST_STATUS.HIDDEN
            ) {
                res.status(400).send("Bài post này không thể từ chối");
                return;
            }
            try {
                await PostRepo.updatePost(post._id, {
                    status: POST_STATUS.REJECTED,
                });
                await notificationRepository.sendNotification({
                    title: "Bài đăng của bạn không được duyệt. Nhấn để xem chi tiết bài đăng",
                    type: NOTIFICATION_TYPE.REJECTED_POST,
                    receiver_id: post?.poster_id,
                    post_id: post?._id,
                    order_id: null
                });
            } catch (err: any) {
                res.status(400).send(err.message);
            }
            res.status(200).send("Duyệt thành công");
        } catch {
            res.status(500).send("Lỗi server");
        }
    }

    async changeVisibility(req: CustomRequest, res: Response): Promise<any> {
        const user = req.account;
        const isVisibility: any = req.body.is_visibility;
        const {id} = req.params;
        try {
            const post = await PostRepo.getPost(id);
            if (isVisibility === undefined || typeof isVisibility !== "boolean")
                return res.status(400).send({ message: "Lỗi yêu cầu" });
            if (!post) return res.status(404).send("Không có bài đăng");

            const isInvalidChange: boolean =
                (!isVisibility && post.status !== POST_STATUS.APPROVED) ||
                (isVisibility && post.status !== POST_STATUS.HIDDEN);
            if (String(post.poster_id) !== String(user._id) || isInvalidChange)
                return res
                    .status(400)
                    .send({ message: "Không có quyền thay đổi" });

            const result = await PostRepo.hideOrShowPost(id, isVisibility);
            if (!result) {
                return res.status(500).send({ message: "Thay đổi thất bại" });
            }
            return res
                .status(200)
                .send({ message: "Thay đổi trạng thái bài viết thành công" });
        } catch (err: any) {
            res.status(500).send(err.message);
        }
    }
}

export default new PostController();
