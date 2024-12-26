import express from "express";
import OrderController from "../controllers/order.controller";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";
const orderRouter = express.Router();

orderRouter.post('/create', [authentication, isNotDeleted], OrderController.createOrder);
orderRouter.get('/',[authentication, isNotDeleted], OrderController.getOrder);
orderRouter.get('/get-my-selling-orders',[authentication, isNotDeleted], OrderController.getMySellingOrders);
orderRouter.get('/get-my-buying-orders',[authentication, isNotDeleted], OrderController.getMyBuyingOrders);
orderRouter.patch('/update-order-status', [authentication, isNotDeleted], OrderController.updateOrderStatus);
orderRouter.patch('/received-order', [authentication, isNotDeleted], OrderController.receivedOrder);
orderRouter.patch('/cancel', [authentication, isNotDeleted], OrderController.cancelOrder);

export default orderRouter;
