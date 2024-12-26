 import {model,  Schema} from "mongoose";

export interface IUser {
    _id: Schema.Types.ObjectId;
    email: string;
    phone: string | null;
    firstname: string;
    lastname: string;
    babies : Schema.Types.ObjectId [] | null
    password: string | null;
    address: string | null;
    avatar: string | null ;
    follower_ids: Schema.Types.ObjectId[];
    following_user_ids: Schema.Types.ObjectId[];
    is_deleted: boolean;
    is_google_account: boolean;
    wishlist: Schema.Types.ObjectId[];
    stripe_account_id: string;
};

const User = new Schema<IUser>({
    email: {
        type: String ,
        required: true , 
        immutable : true
    },
    phone :{
        type: String ,
        default: null
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    babies: {
        type: Schema.Types.ObjectId,
        ref: 'Baby'
    },
    password: {
        type: String,
    },
    address: {
        type: Object,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    follower_ids: [{
        type: Schema.Types.ObjectId,
    }],
    following_user_ids: [{
        type: Schema.Types.ObjectId,
    }],
    wishlist: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    is_google_account: {
        type: Boolean , 
        default : false,
        immutable: true
    },
    stripe_account_id : {
        type: String,
        default: null
    },
    is_deleted: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

export default model<IUser>('User', User);