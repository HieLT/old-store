import express from "express";
const notificationRouter = express.Router();
import notificationController from "../controllers/notification.controller";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";

notificationRouter.get('/', [authentication, isNotDeleted], notificationController.getNotifications);
notificationRouter.patch('/read',[authentication, isNotDeleted] , notificationController.readNotifications);

export default notificationRouter;
