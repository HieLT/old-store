import mongoose, {Document, model, Schema} from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    sender_id: mongoose.Types.ObjectId;
    content: string;
    is_deleted: boolean;
    content_type: string;
}

const MessageSchema = new Schema(
    {
    conversation_id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    content_type: {type: String, required: true},
    seen_at: {type: Date, default: null},
    is_deleted: {
        type: Boolean,
        default: false
    }
},
    {timestamps: true}
);

export default model<IMessage>('Message', MessageSchema);
