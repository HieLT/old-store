import {Request, Response} from "express";
import {IUser} from '../models/user';
import {isValidObjectId, Schema, Types} from "mongoose";
import PostRepository from "../repositories/post.repository";
import UserRepository from "../repositories/user.repository";
import conversationRepository from "../repositories/conversation.repository";


interface CustomRequest extends Request {
    account?: any;
}

class ChatController {
    async createOrUpdateConversation(req: CustomRequest, res: Response): Promise<any> {
        try {
            const user = req.account as IUser;
            const {participantId, latestMentionedPostId} = req.body
            
            if (!isValidObjectId(participantId) || (latestMentionedPostId && !isValidObjectId(latestMentionedPostId))) {
                return res.status(400).send({message: 'ID người tham gia hoặc bài viết không hợp lệ'})
            }
            const participant = await UserRepository.getUserById(participantId)
            if ( String(participant._id) === String(user._id)){
                return res.status(400).send({message: 'Id người tham gia không được trùng'})
            } 
            if (!participant) {
                return res.status(404).send({message: 'Người tham gia không tồn tại'})
            }
            if (latestMentionedPostId) {
                const post = await PostRepository.getPost(latestMentionedPostId)
                if (!post) {
                    return res.status(404).send({message: 'Bài đăng không tồn tại'})
                }
                if (String(post.poster_id) !== participantId) {
                    return res.status(400).send({message: 'Bài đăng không hợp lệ'})
                }
            }

            await conversationRepository.createOrUpdate(String(user?._id), participantId, latestMentionedPostId)
            return res.status(201).send('');
        } catch (err) {
            return res.status(500).send({message: 'Lỗi máy chủ'});
        }
    }
}

export default new ChatController;
