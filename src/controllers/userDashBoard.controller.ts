import { Request,Response } from "express";
import RatingRepo from "../repositories/rating.repository";
import OrderRepo from "../repositories/order.repository";
import { getTimeFormat } from "../utils/helpers";

interface CustomRequest extends Request {
    account?: any;
}

class UserDashboardController {
    async ratings(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        try {
            const ratings = await RatingRepo.ratingUserDashboard(account._id);

            res.status(200).send(ratings);
        }catch(err: any){
            res.status(500).send(err.message);
        }
    }

    async ordersStatus(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        try {
            const ordersStatus = await OrderRepo.ordersStatusUserDashboard(account._id)

            res.status(200).send(ordersStatus);
        }catch(err: any){
            res.status(500).send(err.message);
        }
    }

    async revenue(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        const { groupBy = "month" } = req.query; 
        try {
            const timeFormat = getTimeFormat(String(groupBy));
            const revenue = await OrderRepo.getRevenueUserDashboard(account._id, timeFormat);
    
            res.status(200).send(revenue);
        } catch(err: any){
            res.status(500).send(err.message);
        }
    }
    async expenses(req: CustomRequest, res: Response): Promise<void> {
        const account = req.account;
        const { groupBy = "month" } = req.query; 
        try {
            const timeFormat = getTimeFormat(String(groupBy));
            const expenses = await OrderRepo.getExpensesUserDashboard(account._id, timeFormat);
    
            res.status(200).send(expenses);
        } catch(err: any){
            res.status(500).send(err.message);
        }
    }
    // async userGrowth(req: CustomRequest, res: Response):Promise<void> {
    //     const account = req.account;
    //     const { groupBy = "month" } = req.query;
    //     try {
    
    //         const timeFormat = getTimeFormat(groupBy as string);
    //         const userGrowth = await User.aggregate([
    //             {
    //                 $group: {
    //                     _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
    //                     count: { $sum: 1 },
    //                 },
    //             },
    //             { $sort: { _id: 1 } },
    //         ]);
    
    //         res.json({ success: true, data: userGrowth });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ success: false, message: "Error fetching user growth data" });
    //     }
    // }
}

export default new UserDashboardController();