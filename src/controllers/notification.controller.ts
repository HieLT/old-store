import { Request, Response } from 'express';
import NotificationRepo from '../repositories/notification.repository';

interface CustomRequest extends Request {
    account?: any;
}

class NotificationController {
    async getNotifications(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        const {
            search_key ,
            seen_at,
            page,
            limit
        } = req.query;
        try {
            try {
                const notifications = await NotificationRepo.getNotifications
                    (
                        String(account._id),
                        search_key as string,
                        seen_at as any,
                        Number(page),
                        Number(limit)
                    );
                
                res.status(200).send(notifications);
            } catch (err: any) {
                res.status(400).send(err.message);
            }
        } catch {
            res.status(500).send('Lỗi server');
        }
    }

    async readNotifications(req: CustomRequest, res: Response): Promise<void> {
        const account = req?.account;
        const notificationIds = req.body.notificationIds;
        try {
            try {
                await NotificationRepo.confirmReadNotifications(String(account?._id), notificationIds);

                res.status(200).send();
            } catch (err: any) {
                res.status(400).send(err.message);
            }
        } catch {
            res.status(500).send('Lỗi server');
        }
    }
}
export default new NotificationController();
