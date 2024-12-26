import mongoose, {Document, model, Schema} from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    latest_mentioned_post_id: mongoose.Types.ObjectId | null | string;
    is_deleted: boolean
}

const ConversationSchema = new Schema(
    {
        participants: [{type: Schema.Types.ObjectId, ref: 'User'}],
        latest_mentioned_post_id: {type: Schema.Types.ObjectId, default: null, ref: 'Post'},
        is_deleted: {
            type: Boolean,
            default: false
        }
    },
    {timestamps: true}
);

export default model<IConversation>('Conversation', ConversationSchema);
