import express from "express";
import adminController from "../controllers/admin.controller";
import Multer from '../utils/multer';
import authentication from "../middlewares/authentication";
import isNotDeleted from "../middlewares/isNotDeleted";
import isAdmin from "../middlewares/isAdmin";
import isSuperAdmin from "../middlewares/isSuperAdmin";
import categoryController from "../controllers/category.controller";
import attributeController from "../controllers/attribute.controller";
import postController from "../controllers/post.controller";
const adminRouter = express.Router();

adminRouter.get('/get-profile', [authentication, isNotDeleted, isSuperAdmin], adminController.getProfile);
adminRouter.patch('/update',[authentication, isNotDeleted, isSuperAdmin], adminController.updateAdmin);
adminRouter.patch('/update-avatar',[authentication, isNotDeleted, Multer.getUpload().array('files')], adminController.updateAvatar);
adminRouter.post('/create', [authentication, isNotDeleted, isSuperAdmin], adminController.createAdmin);
adminRouter.patch('/delete-admin', [authentication, isNotDeleted, isSuperAdmin], adminController.deleteAdmin);
adminRouter.patch('/delete-user/:id', [authentication, isNotDeleted, isSuperAdmin], adminController.deleteUser);
adminRouter.patch('/restore-user/:id', [authentication, isNotDeleted, isSuperAdmin], adminController.restoreUser);
adminRouter.get('/get-admins', [authentication,isNotDeleted,isSuperAdmin], adminController.searchAdmin);
adminRouter.get('/get-users', [authentication,isNotDeleted,isSuperAdmin], adminController.searchUser);

/* Manage category */
adminRouter.get(
    '/categories',
    [authentication, isNotDeleted, isSuperAdmin],
    categoryController.getCategoriesAdmin
)
adminRouter.post(
    '/category',
    [authentication, isNotDeleted, isSuperAdmin],
    categoryController.createCategory
)
adminRouter.get(
    '/category/:id',
    [authentication, isNotDeleted, isSuperAdmin],
    categoryController.getCategoryById
)
adminRouter.put(
    '/categories/:id',
    [authentication, isNotDeleted, isSuperAdmin],
    categoryController.updateCategory
)
adminRouter.patch(
    '/categories/:id',
    [authentication, isNotDeleted, isSuperAdmin],
    categoryController.hideOrShowCategory
)

//post
adminRouter.get(
    '/posts',
    [authentication, isNotDeleted, isSuperAdmin],
    postController.getAllPostsForAdmin
)
adminRouter.patch(
    '/manage-post/:post_id/approve',
    [authentication, isNotDeleted, isSuperAdmin],
    postController.approvePost
)
adminRouter.patch(
    '/manage-post/:post_id/reject',
    [authentication, isNotDeleted, isSuperAdmin],
    postController.rejectPost
)

export default adminRouter;