import express from "express";
import userDashboardController from "../controllers/userDashBoard.controller"
import authentication from "../middlewares/authentication";

const userDashboardRouter = express.Router();


// userDashboardRouter.get("/user-dashboard/user-growth",OrderController. );
userDashboardRouter.get('/revenue',authentication, userDashboardController.revenue);
userDashboardRouter.get('/expenses',authentication, userDashboardController.expenses);
userDashboardRouter.get('/ratings',authentication, userDashboardController.ratings);
userDashboardRouter.get('/orders-status',authentication, userDashboardController.ordersStatus );

export default userDashboardRouter;
