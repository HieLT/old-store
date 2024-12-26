import express from "express";
import categoryController from "../controllers/category.controller";
import attributeController from "../controllers/attribute.controller";
import postController from "../controllers/post.controller";
import ratingController from "../controllers/rating.controller";

const publicRouter = express.Router();

publicRouter.get("/categories", categoryController.getCategories);

publicRouter.get(
    "/categories/:id/attributes",
    attributeController.getAttributesOfCategory
);

publicRouter.get("/posts", postController.getAllPosts);

publicRouter.get("/posts/:id", postController.getPostById);

publicRouter.get("/user/:id/posts", postController.getPostsByUserId);

publicRouter.get("/user/:id/ratings", ratingController.getPosterRatings);

export default publicRouter;
