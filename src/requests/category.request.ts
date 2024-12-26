import Joi from 'joi';
import {CATEGORY_ATTRIBUTE_TYPE} from '../utils/enum';
import {validatorMessages} from '../utils/constants';
import {Types} from "mongoose";

export const createCategorySchema = {
    body: Joi.object({
        name: Joi.string()
            .trim()
            .required()
            .label('Tên danh mục')
            .messages({...validatorMessages}),
        description: Joi.string()
            .trim()
            .allow('')
            .label('Mô tả danh mục'),
        attributes: Joi.array().items(Joi.object({
            label: Joi.string().trim().required().label('Tên thuộc tính').messages({...validatorMessages}),
            input_type: Joi.string().valid(...Object.values(CATEGORY_ATTRIBUTE_TYPE)).required().label(`Kiểu đầu vào của thuộc tính`).messages({...validatorMessages}),
            initial_value: Joi.when('input_type', {
                is: Joi.valid(
                    CATEGORY_ATTRIBUTE_TYPE.DROPDOWN,
                    CATEGORY_ATTRIBUTE_TYPE.CHECKBOX
                ),
                then: Joi.alternatives().try(
                    Joi.array().min(1).items(Joi.string().required()).label('Các giá trị ban đầu của thuộc tính')
                ).required(),
                otherwise: Joi.allow('').allow(null)
            }).label('Giá trị ban đầu của thuộc tính').messages({...validatorMessages}),
            is_required: Joi.boolean().required().label('Trường is_required').messages({...validatorMessages})
        }))
    }),
}

export const updateCategorySchema = {
    body: Joi.object({
        name: Joi.string()
            .trim()
            .required()
            .label('Tên danh mục')
            .messages({...validatorMessages}),
        description: Joi.string()
            .trim()
            .allow('')
            .label('Mô tả danh mục'),
        attributes: Joi.array().required().min(0).items(
            Joi.object(
                {
                    _id: Joi.string().label('ID thuộc tính').messages({...validatorMessages}),
                    label: Joi.string().trim().required().label('Tên thuộc tính').messages({...validatorMessages}),
                    input_type: Joi.string().valid(...Object.values(CATEGORY_ATTRIBUTE_TYPE)).required().label(`Kiểu đầu vào của thuộc tính`).messages({...validatorMessages}),
                    initial_value: Joi.when('input_type', {
                        is: Joi.valid(
                            CATEGORY_ATTRIBUTE_TYPE.DROPDOWN,
                            CATEGORY_ATTRIBUTE_TYPE.CHECKBOX
                        ),
                        then: Joi.alternatives().try(
                            Joi.array().min(1).items(Joi.string().required()).label('Các giá trị ban đầu của thuộc tính')
                        ).required(),
                        otherwise: Joi.allow('').allow(null)
                    }).label('Giá trị ban đầu của thuộc tính').messages({...validatorMessages}),
                    is_required: Joi.boolean().required().label('Trường is_required').messages({...validatorMessages}),
                    is_deleted: Joi.boolean().messages({...validatorMessages}).label('Trường is_deleted')
                }
            ).unknown()
        ).messages({...validatorMessages})
    }).unknown()
}
