import AttributeProduct, {IAttributeProduct} from "../models/attribute_product";
import {ClientSession, Types} from 'mongoose';
import postRepository from "./post.repository";

const {ObjectId} = Types

class AttributeProductRepo {
    async getAttributeProduct(attributeProductId: string) {
        try {
            return AttributeProduct.findOne({_id: new ObjectId(attributeProductId), is_deleted: false})
        } catch (err) {
            throw err
        }
    }

    async getAllAttributesProduct(productId: string): Promise<any> {
        try {
            return AttributeProduct.find({product_id: new ObjectId(productId), is_deleted: false}).populate('attribute_id').lean()
        } catch (err) {
            throw err
        }
    }

    async createAttributeProduct(
        isValidate: boolean,
        attributeProduct: Partial<IAttributeProduct>,
        session: ClientSession
    ): Promise<boolean> {
        try {
            const newAttributeProduct = new AttributeProduct(attributeProduct);
            const result = await newAttributeProduct.save({session, validateBeforeSave: isValidate});
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async updateAttributeProduct(
        isDraft: boolean,
        productAttribute: {
            id: string | null;
            productId: string;
            attributeId: string;
            value: any;
        },
        session: ClientSession
    ): Promise<boolean> {
        try {
            const updateOrCreate = {
                product_id: productAttribute.productId,
                attribute_id: productAttribute.attributeId,
                value: productAttribute.value
            }
            let result = null
            if (productAttribute?.id) {
                result = await AttributeProduct.findOneAndUpdate(
                    {_id: new ObjectId(productAttribute?.id), is_deleted: false},
                    updateOrCreate,
                    {
                        session,
                        runValidators: !isDraft,
                        setDefaultsOnInsert: true // Apply default values if creating,
                    }
                );
            } else {
                result = await AttributeProduct.create(
                    [updateOrCreate],
                    {
                        session,
                        runValidators: !isDraft,
                    }
                );
            }
            return !!result;
        } catch (err) {
            throw err;
        }
    }

    async deleteAttributeProduct(id: string): Promise<boolean> {
        try {
            const result = await AttributeProduct.findByIdAndUpdate(id, {is_deleted: true})
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }

    async deleteAttributeProductByUserId(userId: string): Promise<void> {
        try {
            const posts = await postRepository.getAllPostsByUserId(userId)
            await Promise.all([...posts?.map((post) => AttributeProduct.updateMany({product_id: post?.product_id}, {$set: {is_deleted: true}}))])
        } catch (err) {
            throw err;
        }
    }

    async restoreAttributeProductByUserId(userId: string): Promise<void> {
        try {
            const posts = await postRepository.getAllPostsByUserId(userId)
            await Promise.all([...posts?.map((post) => AttributeProduct.updateMany({product_id: post?.product_id}, {$set: {is_deleted: false}}))])
        } catch (err) {
            throw err;
        }
    }

    async restoreAttributeProduct(id: string): Promise<boolean> {
        try {
            const result = await AttributeProduct.findByIdAndUpdate(id, {is_deleted: false})
            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }
}

export default new AttributeProductRepo();
