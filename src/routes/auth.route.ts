import express, { NextFunction } from "express";
import authController from "../controllers/auth.controller";
import authentication from "../middlewares/authentication";
const authRouter = express.Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.patch('/change-password',[authentication], authController.changePassWord);
authRouter.post('/reset-password',  authController.resetPassword);
authRouter.post('/new-access-token', authController.getNewAccessToken)

authRouter.get('/google', authController.loginGoogle);
authRouter.get('/google/callback', authController.callbackGoogle);

export default authRouter;