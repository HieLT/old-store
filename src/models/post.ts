import {model, Schema} from "mongoose";
import {POST_STATUS} from "../utils/enum";

export interface IPost {
    _id: Schema.Types.ObjectId;
    title: string;
    poster_id: Schema.Types.ObjectId;
    product_id: Schema.Types.ObjectId | null;
    status: string;
    location: {
        city: string | null,
        district: string | null
    };
    expired_at: Date | null,
    is_ordering: boolean;
    is_deleted: boolean;
}

const Post = new Schema<IPost>({
    title: {
        type: String,
        required: [true, 'Thiếu title']
    },
    poster_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    status: {
        type: String,
        enum: Object.values(POST_STATUS),
        default: 'pending'
    },
    location: {
        type: {
            city: {
                type: String || null,
                default: null
            },
            district: {
                type: String || null,
                default: null
            },
        },
        required: [true, "Thiếu location"]
    },
    expired_at: {
        type: Date || null,
        default: null
    },
    is_ordering: {
        type: Boolean,
        default :false
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default model<IPost>('Post', Post);
