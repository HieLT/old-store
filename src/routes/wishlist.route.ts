import express from "express";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";
import wishlistController from "../controllers/wishlist.controller";

const wishlistRouter = express.Router();

wishlistRouter.get('/my-wishlist', [authentication, isNotDeleted], wishlistController.getMyWishlist);
wishlistRouter.post('/add-to-wishlist', [authentication, isNotDeleted], wishlistController.addToWishlist);
wishlistRouter.patch('/remove/:id', [authentication, isNotDeleted], wishlistController.removeFromWishlist);

export default wishlistRouter;
