import cron from 'node-cron'
import Post from '../models/post';
import { NOTIFICATION_TYPE, POST_STATUS } from '../utils/enum';
import product from '../models/product';
import attribute_product from '../models/attribute_product';
import baby from '../models/baby';
import notificationRepository from '../repositories/notification.repository';

// every day at 00:00
cron.schedule('0 0 * * *', async () => {
    try {
        await checkExpiredPosts();
    } catch (err) {
        console.log('error', err);
    }
});

async function checkExpiredPosts() {
    try {
        const now = new Date();
        const expiredPostsQuery = {expired_at: {$lt: now}, is_deleted: false, status: POST_STATUS.APPROVED};
        const expiredPosts = await Post.find(expiredPostsQuery).lean();
        if (expiredPosts?.length > 0) {
            await Post.updateMany(expiredPostsQuery, {$set: {status: POST_STATUS.EXPIRED}});
            await Promise.all(expiredPosts?.map(post => notificationRepository.sendNotification({
                title: "Bài đăng của bạn đã hết hạn. Nhấn để xem chi tiết bài đăng",
                type: NOTIFICATION_TYPE.APPROVED_POST,
                receiver_id: String(post?.poster_id),
                post_id: String(post?._id),
                order_id: null
            })))
        }
    } catch (err) {
        throw err;
    }
}

// every month
cron.schedule('0 0 1 * *', async () => {
    try {
        await Promise.all([
            Post.deleteMany({is_deleted: true}),
            product.deleteMany({is_deleted: true}),
            attribute_product.deleteMany({is_deleted: true}),
            baby.deleteMany({is_deleted: true})
        ]);
    } catch (err) {
        console.log('error', err);
    }
});
