import {Request, Response} from "express";
import CateRepo from '../repositories/category.repository';

class CategoryController {
    async getCategories(req: Request, res: Response): Promise<any> {
        return CateRepo.getAllCategoriesForPublic(req.query, res)
    }

    async getCategoryById(req: Request, res: Response): Promise<any> {
        return CateRepo.handleGetCategoryById(req.params.id, res)
    }

    async getCategoriesAdmin(req: Request, res: Response): Promise<any> {
        return CateRepo.getAllCategoriesForAdmin(req.query, res)
    }

    async createCategory(req: Request, res: Response): Promise<any> {
        return CateRepo.handleCreateCategory(req.body, res)
    }

    async updateCategory(req: Request, res: Response): Promise<any> {
        return CateRepo.handleUpdateCategory(req.params.id, req.body, res)
    }

    async hideOrShowCategory(req: Request, res: Response): Promise<any> {
        return CateRepo.handleHideOrShowCategory(req.params.id, req.body, res)
    }
}

export default new CategoryController();
