import { Document, model, Schema } from 'mongoose';
import { ORDER_STATUS, PAYMENT_METHOD } from '../utils/enum';
const Stripe = require('stripe');
const stripe = Stripe(String(process.env.STRIPE_PRIVATE_KEY));

export interface IOrder extends Document {
    customer_id: Schema.Types.ObjectId;
    post_id: Schema.Types.ObjectId;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    payment_method: string;
    status: string;
    total: number | null;
    receiver_stripe_account_id: string;
    stripe_payment_intent_id: string; //for capture strpe checkout payment
    cancelled_user_id : Schema.Types.ObjectId;
    is_deleted: boolean;
}

const OrderSchema = new Schema<IOrder>(
    {
        customer_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        customer_name: {
            type: String,
            required: true,
        },
        customer_phone: {
            type: String,
            required: true,
        },
        customer_address: {
            type: String,
            required: true,
        },
        payment_method: {
            type: String,
            enum: Object.values(PAYMENT_METHOD),
            immutable: true,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PROCESSING,
        },
        total: {
            type: Number,
            default: null,
            validate: {
                validator: function (total: number | null): boolean {
                    if (this.payment_method === PAYMENT_METHOD.CREDIT && !total) {
                        throw new Error(
                            'Total is required when payment method is CREDIT.'
                        );
                    }
                    return true;
                },
            },
        },
        receiver_stripe_account_id: {
            type: String,
            required: true,
            immutable: true,
            validate: {
                validator : async function (receiver_stripe_account_id: string): Promise<boolean> {
                    const account = await stripe.accounts.retrieve(receiver_stripe_account_id);
                    if (!account) throw new Error('receiver_stripe_account_id không tồn tại');
                    return true;
                }
            }
        },
        stripe_payment_intent_id: {
            type: String, 
            default : null
        },
        cancelled_user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default model<IOrder>('Order', OrderSchema);
