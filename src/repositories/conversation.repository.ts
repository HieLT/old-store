import User, { IUser } from "../models/user";
import bcrypt from "bcrypt";
import {Types} from "mongoose";
import Conversation from "../models/conversation";

const { ObjectId } = Types

class ConversationRepo {
    async createOrUpdate(userId: string, participantId: string, latestPostId: string | null): Promise<any> {
        try {
            const conversation = await Conversation.findOne(
                {
                    participants: { $size: 2, $all: [participantId, userId] },
                    is_deleted: false
                }
            )
            if (!conversation) return Conversation.create({
                participants: [participantId, userId],
                latest_mentioned_post_id: latestPostId
            })

            conversation.latest_mentioned_post_id = latestPostId;
            return conversation.save();
        }
        catch (err) {
            throw err;
        }
    }
}
export default new ConversationRepo();