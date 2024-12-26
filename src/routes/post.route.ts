import express from "express";
import postController from "../controllers/post.controller";
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";
import multer from "../utils/multer";
const postRouter = express.Router();

postRouter.get('/get-own-post',[authentication,isNotDeleted],postController.getOwnPost);
postRouter.post('/images-upload', [authentication, isNotDeleted, multer.getUpload().array('images[]', 10)], postController.imagesUpload);
postRouter.post('/create',[authentication, isNotDeleted], postController.createPost);
postRouter.patch('/:id/visibility', [authentication, isNotDeleted], postController.changeVisibility);
postRouter.put('/update/:id',[authentication, isNotDeleted], postController.updatePost);
postRouter.get('/:id', [authentication, isNotDeleted], postController.getPostById)

export default postRouter;
