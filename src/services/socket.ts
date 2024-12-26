import { Types } from "mongoose";
import Conversation, { IConversation } from "../models/conversation";
import Message, { IMessage } from "../models/message";

const { ObjectId } = Types;

export const userSockets: Record<string, string> = {};

export default async function connectSocket(io: any) {
    try {
        io.on("connection", (socket: any) => {
            console.log(`New connection: ${socket.id}`);

            // Handle user registration and store the socketId under their userId
            let userId: any = socket.handshake.query?.user_id;

            userSockets[socket.id] = userId;
            console.log(`User ${userId} connected with socket ID ${socket.id}`);

            const onlineUserIds = Array.from(io.sockets.sockets.keys());

            onlineUserIds.forEach(async (socketId: any) => {
                try {
                    const conversations = await Conversation.find({
                        participants: {
                            $in: [userSockets[socketId]],
                        },
                    })
                        .populate({
                            path: "participants",
                        })
                        .populate({
                            path: "latest_mentioned_post_id",
                            populate: {
                                path: "product_id",
                            },
                        })
                        .lean();

                    const result = conversations?.map((item) => {
                        return {
                            _id: item._id,
                            participant: item.participants.find(
                                (participant) =>
                                    participant._id.toString() !==
                                    userSockets[socketId]
                            ),
                            lastest_mentioned_post:
                                item?.latest_mentioned_post_id,
                        };
                    });

                    io.to(socketId).emit("getConversations", result);
                } catch (err) {
                    socket.emit("err", { error: err });
                }
            });

            socket.on(
                "getMessages",
                async (
                    {
                        conversationId,
                    }: {
                        conversationId: string;
                    },
                    callback: (messages: IMessage[]) => void
                ) => {
                    try {
                        const messages = await Message.find({
                            conversation_id: new ObjectId(conversationId),
                        });
                        callback(messages);
                    } catch (err: any) {
                        console.log("err", err);
                        socket.emit("err", { error: err });
                    }
                }
            );

            socket.on(
                "getUnreadMessages",
                async (
                    { userId }: { userId: string },
                    callback: (res: any) => void
                ) => {
                    try {
                        const conversations = await Conversation.aggregate([
                            {
                                $match: {
                                    participants: {
                                        $in: [new ObjectId(userId)],
                                    },
                                    is_deleted: false,
                                },
                            },
                            {
                                $lookup: {
                                    from: "messages",
                                    localField: "_id",
                                    foreignField: "conversation_id",
                                    pipeline: [
                                        {
                                            $match: {
                                                sender_id: {
                                                    $ne: new ObjectId(userId),
                                                },
                                                seen_at: null,
                                                is_deleted: false,
                                            },
                                        },
                                        {
                                            $count: "unreadCount",
                                        },
                                    ],
                                    as: "unreadMessages",
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    unreadMessages: 1,
                                },
                            },
                        ]);

                        callback(
                            conversations?.map((item) => ({
                                _id: item._id,
                                unreadMessages:
                                    item?.unreadMessages?.[0]?.unreadCount || 0,
                            }))
                        );
                    } catch (err: any) {
                        console.log("err", err);
                        socket.emit("err", { error: err });
                    }
                }
            );

            socket.on(
                "seenMessage",
                async ({ conversationId }: { conversationId: string }) => {
                    await Message.updateMany(
                        {
                            conversation_id: new ObjectId(conversationId),
                            is_deleted: false,
                        },
                        { $set: { seen_at: Date.now() } }
                    );
                }
            );

            socket.on(
                "sendMessage",
                ({
                    senderUserId,
                    recipientUserId,
                    message,
                    conversationId,
                    contentType,
                }: {
                    senderUserId: string;
                    recipientUserId: string;
                    message: string;
                    conversationId: string;
                    contentType: string;
                }) => {
                    const recipientSocketId = Object.keys(userSockets)?.find(
                        (key) => userSockets[key] === recipientUserId
                    );

                    Message.create({
                        conversation_id: conversationId,
                        sender_id: senderUserId,
                        content: message,
                        content_type: contentType,
                    });

                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit("receiveMessage", {
                            senderUserId,
                            message,
                            conversationId,
                        });
                    }
                }
            );

            // Handle user disconnection
            socket.on("disconnect", (reason: any) => {
                // Remove the socketId from userSockets when they disconnect
                delete userSockets[socket.id];
                console.log(`Socket ${socket.id} disconnected ${reason}`);
            });
        });
    } catch (err: any) {
        console.log(err.message);
    }
}
