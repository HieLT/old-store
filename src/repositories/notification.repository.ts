import { Types } from "mongoose";
import Notification, { INotification } from "../models/notification";
import { io } from "../server";
import { userSockets } from "../services/socket";

const { ObjectId } = Types;

class NotificationRepo {
    async sendNotification({
        title,
        type,
        receiver_id,
        post_id,
        order_id
    }: {
        title: string;
        type: string;
        receiver_id: string;
        post_id: string | null;
        order_id: string | null;
    }) {
        try {
            const newNotification = await Notification.create({
                title,
                type,
                receiver_id,
                post_id,
                order_id
            });
            const onlineSocketIds = Object.keys(userSockets)?.filter(
                (key) => userSockets[key] === String(receiver_id)
            );

            if (onlineSocketIds?.length > 0) {
                onlineSocketIds?.forEach((socketId: string) => {
                    io.to(socketId).emit("notification", { newNotification });
                })
            }
        } catch (err) {
            throw err;
        }
    }

    async getNotifications(
        userId: string,
        searchKey: string = "",
        seen_at: Date | null = null,
        page: number = 1,
        limit: number = 10
    ): Promise<INotification[]> {
        try {
            let searchQuery: any = {
                receiver_id: new ObjectId(userId),
                is_deleted: false,
            };
            if (searchKey)
                searchQuery = {
                    ...searchQuery,
                    searchKey: { $regex: searchKey, $options: "i" },
                };

            const result = await Notification.find(searchQuery)
                .populate("post_id")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();

            return result;
        } catch (err) {
            throw err;
        }
    }

    async confirmReadNotifications(receiverId: string, notificationIds: string[]): Promise<boolean> {
        try {
            const result = await Notification.updateMany(
                {
                    _id: {$in: notificationIds?.map(item => new ObjectId(item))}, 
                    receiver_id: new ObjectId(receiverId), 
                    is_deleted: false, 
                    seen_at: null
                }, 
                {$set: {seen_at: new Date()}}
            );

            return !!result;
        } catch (err) {
            throw err;
        }
    }
}
export default new NotificationRepo();
