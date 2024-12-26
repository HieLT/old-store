import { model, Schema } from "mongoose";
import {ADMIN_ROLE} from "../utils/enum";

export interface IAdmin {
    _id: Schema.Types.ObjectId;
    firstname?: string,
    lastname?: string,
    avatar?: string | null,
    username: string;
    password: string;
    role: "admin" | "super_admin";
    is_deleted: boolean;
}

const Admin = new Schema<IAdmin>({
    firstname: {
        type: String,
        default: null
    },
    lastname: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ADMIN_ROLE,
        default: "admin",
        immutable : true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default model<IAdmin>('Admin', Admin);
