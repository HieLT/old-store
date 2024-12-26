import express from "express";
import babyController from "../controllers/baby.controller";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";
const babyRouter = express.Router();

babyRouter.get('/get-babies', [authentication, isNotDeleted], babyController.getBabies);
babyRouter.post('/create', [authentication, isNotDeleted], babyController.createBaby);
babyRouter.patch('/update', [authentication, isNotDeleted], babyController.updateBaby);
babyRouter.delete('/delete', [authentication, isNotDeleted], babyController.deleteBaby);

export default babyRouter;