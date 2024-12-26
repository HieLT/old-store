import express from "express";
import userController from "../controllers/user.controller";
import multer from '../utils/multer';
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";

const userRouter = express.Router();

userRouter.get('/get-profile',[authentication, isNotDeleted], userController.getProfile);
userRouter.get('/get-user-profile/:id', userController.getUserProfile);
userRouter.patch('/update',[authentication, isNotDeleted], userController.updateUser);
userRouter.patch('/update-avatar',[authentication, isNotDeleted, multer.getUpload().single('file')], userController.updateAvatar);
userRouter.patch('/follow-user', [authentication, isNotDeleted], userController.followUser);
userRouter.patch('/unfollow-user', [authentication, isNotDeleted], userController.unfollowUser);

export default userRouter;
