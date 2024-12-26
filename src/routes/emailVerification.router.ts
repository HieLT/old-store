import express from "express";
import emailVerifyController from "../controllers/emailVerify.controller";
const emailVerificationRouter = express.Router();

emailVerificationRouter.post('/register', emailVerifyController.emailRegisterVerification);
emailVerificationRouter.patch('/reset-password' , emailVerifyController.emailResetPasswordVerification);

export default emailVerificationRouter;
