import {model, Schema} from "mongoose";

export interface IRating {
    _id: Schema.Types.ObjectId;
    reviewer_id: Schema.Types.ObjectId;
    reviewee_id: Schema.Types.ObjectId;
    comment: string;
    stars: number;
    is_deleted: boolean;
}

const RatingSchema = new Schema<IRating>({
    reviewer_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewee_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stars: {
        type: Number,
        required: true,
        default: 0
    },
    comment: {
        type: String,
        default: null
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default model<IRating>('Rating', RatingSchema);
