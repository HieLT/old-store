import {model, Schema} from "mongoose";
import AttributeRepo from "../repositories/attribute.repository";
import {CATEGORY_ATTRIBUTE_TYPE} from "../utils/enum";
import dayjs from "dayjs";
import ProductRepository from "../repositories/product.repository";
import Product from '../models/product'

export interface IAttributeProduct {
    _id: Schema.Types.ObjectId,
    product_id: Schema.Types.ObjectId,
    attribute_id: Schema.Types.ObjectId,
    value: string[] | string | null;
    is_deleted: boolean
}

const AttributeProduct = new Schema<IAttributeProduct>({
    product_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'product_id là thuộc tính bắt buộc'],
        ref: 'Product',
        immutable: true,
    },
    attribute_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'attribute_id là thuộc tính bắt buộc'],
        ref: 'Attribute',
        immutable: true,
    },
    value: {
        type: Schema.Types.Mixed,
        default: null,
        validate: {
            validator: async function (input: string | string[] | null) {
                const attribute = await AttributeRepo.getAttribute(String(this.attribute_id));
                if ((!input || input.length === 0) && attribute.is_required) throw new Error(`attribute_id:${this.attribute_id} Đầu vào là bắt buộc`);
                const attribute_type = attribute.input_type;
                const attribute_initial_value: string[] | null = attribute.initial_value;

                if (attribute_type === CATEGORY_ATTRIBUTE_TYPE.DROPDOWN) {
                    if (input === null) return true
                    if (typeof input === 'string') {
                        const isValid = attribute_initial_value?.includes(input);
                        if (!isValid) {
                            throw new Error(`attribute_id:${this.attribute_id} Đầu vào của thuộc tính phải là ${attribute_initial_value}`);
                        }
                        return isValid;
                    }
                    return false
                }
                if (attribute_type === CATEGORY_ATTRIBUTE_TYPE.CHECKBOX) {
                    const isValid = Array.isArray(input) && input.every(item => attribute_initial_value?.includes(item));
                    if (!isValid) {
                        throw new Error(`attribute_id:${this.attribute_id} Đầu vào của thuộc tính phải là 1 mảng các giá trị và phải nằm trong [${attribute_initial_value?.join(', ')}]`);
                    }
                    return isValid;
                }
                if (attribute_type === CATEGORY_ATTRIBUTE_TYPE.TEXT || attribute_type === CATEGORY_ATTRIBUTE_TYPE.COLOR_PICKER) {
                    if (input === null) return true;
                    if (typeof (input) !== 'string') {
                        throw new Error(`attribute_id:${this.attribute_id} Đầu vào của thuộc tính phải là 1 string`);
                    }
                    return true;
                }
                if (attribute_type === CATEGORY_ATTRIBUTE_TYPE.DATE || attribute_type === CATEGORY_ATTRIBUTE_TYPE.TIME) {
                    if (input === null || dayjs.isDayjs(input)) {
                        return true;
                    }
                    throw new Error(`attribute_id:${this.attribute_id} Đầu vào của thuộc tính phải là 1 chuỗi dạng ngày hoặc giờ`);
                }
                return false
            },
            message: () => 'Loại thuộc tính không hợp lệ'
        },
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

export default model<IAttributeProduct>('AttributeProduct', AttributeProduct);
