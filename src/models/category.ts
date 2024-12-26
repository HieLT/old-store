import {Document, model, Schema} from "mongoose";

export interface ICategory extends Document {
    _id: Schema.Types.ObjectId;
    name: string;
    description?: string;
    is_deleted: boolean;
}

const CategorySchema = new Schema<ICategory>({
    name: {
        type: String,
        required: [true,'Thuộc tính name là bắt buộc']
    },
    description: {
        type: String
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default model<ICategory>('Category', CategorySchema);
