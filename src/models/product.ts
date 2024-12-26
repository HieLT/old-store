import {Document, model, Schema} from "mongoose";

export interface IProduct extends Document {
    _id: Schema.Types.ObjectId;
    description?: string;
    images: string[];
    price?: number;
    condition: 'New' | 'Used' | 'Like New';
    category_id: Schema.Types.ObjectId;
    is_deleted: boolean
}

const ProductSchema = new Schema<IProduct>({
    description: {
        type: String,
        default: null
    },
    images: {
        type: [String],
        required: [true, 'images là thuộc tính bắt buộc']
    },
    price: {
        type: Number,
        default: null
    },
    condition: {
        type: String,
        enum: ["new", "like_new", 'used'],
        required: [true, 'condition là thuộc tính bắt buộc']
    },
    category_id: {
        type: Schema.Types.ObjectId,
        required: [true, 'category_id là thuộc tính bắt buộc'],
        ref: 'Category',
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default model<IProduct>('Product', ProductSchema);
