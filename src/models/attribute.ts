import {Document, model, Schema} from "mongoose";
import {CATEGORY_ATTRIBUTE_TYPE} from "../utils/enum";

export interface IRequestAttribute {
    label: string,
    input_type: string,
    initial_value: string[] | string | [],
    is_required: boolean,
}

export interface IAttribute extends Document, IRequestAttribute {
    _id: Schema.Types.ObjectId | string;
    is_deleted: boolean,
    category_id: Schema.Types.ObjectId | string
}

const AttributeSchema: Schema<IAttribute> = new Schema<IAttribute>({
    label: {
        type: String,
        required: true
    },
    input_type: {
        type: String,
        required: true,
        enum: CATEGORY_ATTRIBUTE_TYPE
    },
    initial_value: {
        type: Schema.Types.Mixed,
        required: function(): boolean {
            // @ts-ignore
            const attributeType = this.input_type
            return (attributeType === CATEGORY_ATTRIBUTE_TYPE.CHECKBOX
                || attributeType === CATEGORY_ATTRIBUTE_TYPE.DROPDOWN)
        }
    },
    is_required: {
        type: Boolean,
        default: false,
        required: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    category_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    }
}, {
    timestamps: true
});

export default model<IAttribute>('Attribute', AttributeSchema);
