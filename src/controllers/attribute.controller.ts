import {Request, Response} from "express";
import attributeRepository from "../repositories/attribute.repository";
import Category from "../models/category";
import {checkIsObjectId} from "../utils/helpers";
import {Types} from "mongoose";

const {ObjectId} = Types

class AttributeController {
    async getAttributesOfCategory(req: Request, res: Response): Promise<any> {
        try {
            const categoryId: string = req.params.id;
            if (!checkIsObjectId(categoryId)) {
                return res.status(400).send({message: 'ID danh mục không hợp lệ'});
            }
            const category = await Category.findOne({_id: new ObjectId(categoryId), is_deleted: false})
            if (!category) {
                return res.status(404).send({message: 'Danh mục không tồn tại hoặc đã bị ẩn'});
            }

            const attributes = await attributeRepository.getAttributes(categoryId);
            return res.status(200).send({attributes: attributes || []})
        } catch {
            return res.status(500)
        }
    }
}

export default new AttributeController();
