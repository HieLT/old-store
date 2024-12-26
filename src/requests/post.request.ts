import Joi from "joi";
import {validatorMessages} from "../utils/constants";
import {PRODUCT_CONDITION} from "../utils/enum";

export const updatePostSchema = {
    body: Joi.object({
        title: Joi.string()
            .required().allow("").allow(null)
            .max(255).label('Tiêu đề bài viết').messages({...validatorMessages}),
        location: Joi.object({
            city: Joi.string().required().allow("").allow(null).label('Tỉnh, thành phố').messages({...validatorMessages}),
            district: Joi.string().required().allow("").allow(null).label('Quận, huyện').messages({...validatorMessages})
        }).required().label('Địa chỉ').messages({...validatorMessages}),
        product: Joi.object({
            description: Joi.string().allow("").allow(null).max(400).label('Mô tả sản phẩm').messages({...validatorMessages}),
            images: Joi.array().required().label('Ảnh sản phẩm').messages({...validatorMessages}),
            product_attributes: Joi.array().items(
                Joi.object({
                    attribute_id: Joi.string().required().label('ID thuộc tính của danh mục').messages({...validatorMessages}),
                    product_id: Joi.string().required().label('ID sản phẩm bài đăng').messages({...validatorMessages}),
                    value: Joi.string().required().label('Giá trị thuộc tính của sản phẩm').messages({...validatorMessages})
                }).unknown()).required().messages({...validatorMessages}),
            category_id: Joi.string().required().label('ID danh mục sản phẩm').messages({...validatorMessages}),
            price: Joi.number().allow(null).allow("").label('Giá sản phẩm').messages({...validatorMessages}),
            condition: Joi.string().valid('like_new', 'new', 'used').required().label('Tình trạng sản phẩm').messages({...validatorMessages})
        }),
        status: Joi.string().messages({...validatorMessages})
    }),
}
