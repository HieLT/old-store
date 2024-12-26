import Attribute, {IAttribute, IRequestAttribute} from "../models/attribute";
import {createCategorySchema, updateCategorySchema} from "../requests/category.request";
import {
    checkIfTwoArrayEqualsUnordered,
    checkIsObjectId,
    countDuplicateValue,
    getDetailErrorMessage,
    removeVietnameseTones
} from "../utils/helpers";
import Category from "../models/category";
import {DEFAULT_GET_QUERY} from "../utils/constants";
import _, {isSafeInteger} from "lodash";
import {Types} from "mongoose";
import {ACCOUNT_ROLE, NOTIFICATION_TYPE, POST_STATUS, VISIBLE_ACTION} from "../utils/enum";
import attribute_product from "../models/attribute_product";
import product from "../models/product";
import post from "../models/post";
import notificationRepository from "./notification.repository";

const {ObjectId} = Types

interface IQuery {
    q?: string,
    page?: number,
    page_size?: number,
    column?: string,
    sort_order?: number
}

interface IUpdateCategoryData {
    name: string,
    description: string
    attributes: IAttribute[]
}

class CategoryRepo {
    async handleGetCategories({q, page, page_size, column, sort_order}: IQuery, role: string, res: any) {
        const isAdmin = role === ACCOUNT_ROLE.ADMIN
        try {
            const currentPage: number = (_.isNaN(page) || Number(page) <= 0 || !page) ? DEFAULT_GET_QUERY.PAGE : Number(page)
            const pageSize: number = (_.isNaN(page_size) || Number(page_size) <= 0 || !page_size) ? DEFAULT_GET_QUERY.PAGE_SIZE : Number(page_size)
            const searchStringRegex = q ? new RegExp(q, 'i') : ''
            let sortOrder = DEFAULT_GET_QUERY.SORT_ORDER
            const sortColumn = column || DEFAULT_GET_QUERY.COLUMN

            try {
                if (sort_order !== undefined) {
                    const order = Number(sort_order)
                    if (isSafeInteger(order) && order >= -1 && order <= 1) {
                        sortOrder = order === 0 ? DEFAULT_GET_QUERY.SORT_ORDER : order
                    }
                }
            } catch (e) {
                sortOrder = DEFAULT_GET_QUERY.SORT_ORDER
            }

            let condition: any = !isAdmin ? [{$match: {is_deleted: false}}] : []
            const totalQueryCondition = !isAdmin ? {is_deleted: false} : {}
            const total = await Category.countDocuments({...totalQueryCondition})

            if (searchStringRegex) {
                condition = [...condition, {$match: {name: searchStringRegex}}]
            }
            // @ts-ignore
            if (sortOrder) {
                condition = [...condition, {$sort: {[sortColumn]: sortOrder}}]
            }

            condition = [
                ...condition,
                {$skip: (currentPage - 1) * pageSize},
                {$limit: pageSize}
            ]

            condition = isAdmin ? [
                ...condition,
                {
                    $lookup: {
                        from: 'attributes',
                        localField: '_id',
                        foreignField: 'category_id',
                        as: 'attributes'
                    }
                },
                {$project: {__v: 0, 'attributes.__v': 0}}
            ] : [...condition, {$project: {__v: 0}}]

            const categories = await Category.aggregate([...condition])

            return res.status(200).send({
                categories,
                metadata: {
                    page: currentPage,
                    pageSize,
                    total
                }
            })

        } catch (err) {
            return res.status(500).send({
                message: 'Lỗi máy chủ',
                details: err
            })
        }
    }

    async getAllCategoriesForPublic(reqQuery: IQuery, res: any): Promise<any> {
        return this.handleGetCategories(reqQuery, ACCOUNT_ROLE.USER, res)
    }

    async getAllCategoriesForAdmin(reqQuery: IQuery, res: any): Promise<any> {
        return this.handleGetCategories(reqQuery, ACCOUNT_ROLE.ADMIN, res)
    }

    async handleGetCategoryById(categoryId: string, res: any): Promise<any> {
        try {
            if (!checkIsObjectId(categoryId)) {
                return res.status(400).send({message: 'ID danh mục không hợp lệ'})
            }
            const category = await Category.aggregate([
                {$match: {_id: new ObjectId(categoryId), is_deleted: false}},
                {
                    $lookup: {
                        from: 'attributes',
                        localField: '_id',
                        foreignField: 'category_id',
                        as: 'attributes'
                    }
                },
                {$unwind: {path: '$attributes', preserveNullAndEmptyArrays: true}},
                {$match: {'attributes.is_deleted': {$in: [false, null]}}},
                {
                    $group: {
                        _id: '$_id',
                        name: {$first: '$name'},
                        description: {$first: '$description'},
                        attributes: {$push: '$attributes'}
                    }
                }
            ])
            if (category?.length === 0) {
                return res.status(404).send({message: 'Danh mục không tồn tại hoặc đã bị ẩn'})
            }
            return res.status(200).send({category: category[0]})
        } catch (err) {
            return res.status(500).send({message: 'Lỗi máy chủ'})
        }
    }

    async handleCreateCategory(requestBody: {
        name: string,
        description: string,
        attributes: IRequestAttribute[]
    }, res: any): Promise<any> {
        try {
            /* Validation */
            const {name, description, attributes} = requestBody
            const {error} = createCategorySchema.body.validate(
                requestBody, {abortEarly: false}
            )
            if (error) {
                return res.status(400).send({
                    message: 'Lỗi yêu cầu',
                    details: getDetailErrorMessage(error)
                })
            }

            /* Check if category name exists */
            const isCategoryExist = await Category.findOne({name, is_deleted: false})
            if (isCategoryExist) {
                return res.status(400).send({message: 'Danh mục đã tồn tại'})
            }

            /* Create new */
            const newCategory = await Category.create({name, description: description || null})
            if (attributes?.length > 0) {
                Promise.all(attributes?.map(async (item: IRequestAttribute) => {
                    return Attribute.create({
                        label: item.label,
                        input_type: item.input_type,
                        initial_value: item.initial_value,
                        is_required: item.is_required,
                        category_id: newCategory._id
                    })
                }))
                    .then()
                    .catch(() => {
                        return res.status(500).send({message: 'Lỗi máy chủ'})
                    })
            }

            return res.status(201).send({message: 'Tạo danh mục sản phẩm thành công'})
        } catch (err) {
            return res.status(500).send({message: 'Lỗi máy chủ'})
        }
    }

    async handleUpdateCategory(categoryId: string, updateCategoryData: IUpdateCategoryData, res: any): Promise<any> {
        try {
            /* Validation */
            if (!checkIsObjectId(categoryId)) {
                return res.status(400).send({message: 'ID danh mục không hợp lệ'})
            }
            const categoryObjectId = new ObjectId(categoryId)
            const category = await Category.findOne({_id: categoryObjectId, is_deleted: false})
            if (!category) {
                return res.status(404).send({message: 'Danh mục không tồn tại hoặc đã bị ẩn'})
            }

            const {error} = updateCategorySchema.body.validate(updateCategoryData, {
                abortEarly: false,
                allowUnknown: true
            })
            if (error) {
                return res.status(400).send({
                    message: 'Lỗi yêu cầu',
                    details: getDetailErrorMessage(error)
                })
            }

            const isExistCategory = await Category.findOne({
                name: updateCategoryData.name,
                _id: {$ne: categoryObjectId},
                is_deleted: false
            })
            if (isExistCategory) {
                return res.status(400).send({
                    message: 'Lỗi yêu cầu',
                    details: {
                        name: 'Tên danh mục đã tồn tại'
                    }
                })
            }

            category.name = updateCategoryData.name
            category.description = updateCategoryData.description

            const attributes = await Attribute.find({category_id: new ObjectId(categoryId), is_deleted: false})
            if (attributes?.length === 0) {
                /* Add new attributes if has no attributes in db */
                await Promise.all([
                    category.save(),
                    Attribute.insertMany([...updateCategoryData.attributes?.map(item => ({
                        ...(_.omit(item, '_id')),
                        category_id: new ObjectId(categoryId)
                    }))])
                ])
            } else {
                /* Check attribute ID */
                let invalidIds: string[] = []
                updateCategoryData.attributes?.forEach(attr => {
                    if (attr?._id && !ObjectId.isValid(attr._id as string)) {
                        invalidIds = [...invalidIds, String(attr._id)]
                    }
                })
                if (invalidIds?.length > 0) {
                    return res.status(400).send(`ID ${invalidIds?.join(', ')} không hợp lệ`)
                }

                /* Check valid records and id */
                let oldRequestAttributeIds: string[] = []
                updateCategoryData.attributes?.forEach(item => {
                    if (item.hasOwnProperty('_id')) {
                        // @ts-ignore
                        oldRequestAttributeIds = [...oldRequestAttributeIds, item._id]
                    }
                })
                const existIds = attributes?.map(item => String(item._id))
                let isValid = checkIfTwoArrayEqualsUnordered(oldRequestAttributeIds, existIds)
                if (!isValid) {
                    return res.status(400).send({message: 'Tồn tại thuộc tính không thuộc danh mục này hoặc không đủ thuộc tính'})
                }

                /* Check duplicate attribute label */
                const duplicateLabels: string[] = countDuplicateValue(updateCategoryData.attributes, 'label')
                if (duplicateLabels?.length > 0) {
                    return res.status(400).send({
                        message: 'Lỗi yêu cầu',
                        details: {
                            label: `Thuộc tính ${duplicateLabels?.join(', ')} bị lặp lại`
                        }
                    })
                }

                /* Check duplicate values in initial values if exist */
                const attributesHaveOptions = updateCategoryData.attributes?.filter(item => item?.initial_value)
                if (attributesHaveOptions?.length > 0) {
                    let isError = false
                    for (let i = 0; i < attributesHaveOptions?.length; i++) {
                        const item: IAttribute = attributesHaveOptions[i]
                        if (item.initial_value && item.initial_value?.length > 0) {
                            const duplicateOptions: string[] = countDuplicateValue(item.initial_value)
                            if (duplicateOptions?.length > 0) {
                                isError = true
                                break
                            }
                        }
                    }
                    if (isError) {
                        return res.status(400).send({
                            message: 'Lỗi yêu cầu',
                            details: {
                                initialValues: `Các giá trị lựa chọn không được trùng nhau trong cùng 1 thuộc tính`
                            }
                        })
                    }
                }

                const deletedAttrbute = updateCategoryData?.attributes?.filter(attribute => attribute.hasOwnProperty('_id') && attribute?.is_deleted)

                /* Update */
                const deleteAttributeProducts = deletedAttrbute?.map(attributeId => attribute_product.updateMany({attribute_id: attributeId}, {$set: {is_deleted: true}}))
                const updatePromises = updateCategoryData.attributes?.map(async (item) => {
                    const updatedAttribute = (item?._id && ObjectId.isValid(item?._id as string) &&
                        attributes?.some(attr => String(attr._id) === String(item?._id))) ?
                        {
                            ...item,
                            category_id: new ObjectId(categoryId)
                        } : {
                            ...(_.omit(item, '_id')),
                            category_id: new ObjectId(categoryId)
                        }

                    if (item?._id) {
                        const existAttribute = attributes?.find(attr => String(attr._id) === String(item?._id))?.toObject()
                        // @ts-ignore
                        const {createdAt, updatedAt, category_id, __v, ...existAttrWithoutRedundant} = existAttribute

                        if (_.isEqual({
                            ...existAttrWithoutRedundant,
                            _id: String(existAttrWithoutRedundant._id)
                        }, item)) {
                            // request item same with item in db
                            return new Promise((resolve) => {
                                return resolve(() => {
                                })
                            })
                        }

                        return Attribute.findOneAndUpdate({_id: item?._id}, updatedAttribute)
                    }
                    return Attribute.create(updatedAttribute)
                })
                await Promise.all([category.save(), ...updatePromises, ...deleteAttributeProducts])
            }

            const oldPostsUsingCategory = await post.aggregate([
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product_id',
                        foreignField: '_id',
                        as: 'product'
                    },
                },
                { $unwind: '$product' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'poster_id',
                        foreignField: '_id',
                        as: 'poster'
                    },
                },
                { $unwind: '$poster' },
                {
                    $group: {
                        _id: '$poster._id',
                        post: { $first: '$$ROOT' }
                    }
                },
                {
                    $replaceRoot: { newRoot: '$post' }
                },
                { 
                    $match: {
                        'product.category_id': new ObjectId(categoryId),
                        'product.is_deleted': false,
                        status: { $in: [POST_STATUS.APPROVED, POST_STATUS.PENDING] },
                        is_deleted: false,
                        is_ordering: false,
                        'poster.is_deleted': false
                    } 
                },
            ])

            await Promise.all(oldPostsUsingCategory?.map(post => {
                return notificationRepository.sendNotification({
                    post_id: post._id,
                    order_id: null,
                    title: `Các thuộc tính của danh mục ${category.name} đã thay đổi. Vui lòng cập nhật bài đăng theo các thuộc tính mới.`,
                    type: NOTIFICATION_TYPE.UPDATED_CATEGORY,
                    receiver_id: post.poster._id
                })
            }))

            return res.status(200).send({message: 'Cập nhật danh mục thành công'})

        } catch (err) {
            return res.status(500).send({
                message: 'Lỗi máy chủ',
                detail: err
            })
        }
    }

    async handleHideOrShowCategory(categoryId: string, {type}: { type: string }, res: any): Promise<any> {
        try {
            /* Validation */
            const isDeleted = type === VISIBLE_ACTION.HIDE

            if (!checkIsObjectId(categoryId)) {
                return res.status(400).send({message: 'ID danh mục không hợp lệ'})
            }
            if (type !== VISIBLE_ACTION.HIDE && type !== VISIBLE_ACTION.SHOW) {
                return res.status(400).send({message: 'Trường type không hợp lệ'})
            }
            const categoryObjectId = new ObjectId(categoryId)
            let category;
            category = await Category.find({_id: categoryObjectId, is_deleted: false})
            if (category?.length > 1) {
                return res.status(400).send({message: 'Một danh mục cùng tên đang được hiển thị'})
            }

            if (type === VISIBLE_ACTION.HIDE) {
                category = await Category.findOne({_id: categoryObjectId, is_deleted: false})
                if (!category) {
                    return res.status(400).send({message: 'Danh mục không tồn tại hoặc đã bị ẩn trước đó'})
                }
            } else {
                category = await Category.findOne({_id: categoryObjectId, is_deleted: true})
                if (!category) {
                    return res.status(400).send({message: 'Danh mục đang được hiển thị'})
                }
            }

            category.is_deleted = isDeleted
            const productIds = await product.distinct("_id", {category_id: categoryObjectId, is_deleted: !isDeleted})
            await Promise.all([
                category.save(),
                Attribute.updateMany(
                    {
                        category_id: categoryObjectId,
                        is_deleted: !isDeleted
                    },
                    {$set: {is_deleted: isDeleted}}
                ),
                product.updateMany({category_id: categoryObjectId, is_deleted: !isDeleted}, {$set: {is_deleted: isDeleted}}),
                post.updateMany({
                    product_id: {$in: productIds}
                }, { $set: { is_deleted: isDeleted } }),
                attribute_product.updateMany({
                    product_id: {$in: productIds}
                }, { $set: { is_deleted: isDeleted } })
            ])

            return res.status(200).send(`${isDeleted ? 'Ẩn danh mục thành công' : 'Đã hiển thị danh mục'}`)
        } catch (err) {
            return res.status(500).send({
                message: 'Lỗi máy chủ',
                detail: err
            })
        }
    }
}

export default new CategoryRepo();