import express from "express";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";
import chatController from "../controllers/chat.controller";

const chatRouter = express.Router();

chatRouter.post('/create-conversation', [authentication, isNotDeleted], chatController.createOrUpdateConversation);

export default chatRouter;
