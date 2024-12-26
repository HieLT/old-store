import express from "express";
import ratingController from "../controllers/rating.controller";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";

const ratingRouter = express.Router();

ratingRouter.post(
    "/rate-user",
    [authentication, isNotDeleted],
    ratingController.rateUser
);
ratingRouter.patch(
    "/delete-rating/:id",
    [authentication, isNotDeleted],
    ratingController.deleteRating
);

export default ratingRouter;
