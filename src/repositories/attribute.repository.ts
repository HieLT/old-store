import Attribute from "../models/attribute";
import {checkIfTwoArrayEqualsUnordered, checkIsObjectId, getDetailErrorMessage} from "../utils/helpers";
import _ from "lodash";
import {Types} from "mongoose";
import Category from "../models/category";

const {ObjectId} = Types

interface IAttribute {
    _id?: string,
    label: string,
    input_type: string,
    initial_value: string[] | [],
    is_required: boolean
}

class AttributeRepo {
    async getAttribute(attributeId: string): Promise<any> {
        try {
            return Attribute.findOne({_id: new ObjectId(attributeId), is_deleted: false});
        } catch (error) {
            throw error;
        }
    }
    async getAttributesRequired(categoryId: string): Promise<any> {
        try {
            const attributes = await Attribute.find(
                {
                    category_id: categoryId,
                    is_required: true,
                    is_deleted: false
                },
                {
                    is_deleted: 0,
                    __v: 0
                }
            )
            return attributes;
        } catch (error) {
            console.error('Error fetching required attributes:', error);
            return [];
        }
    }
    
    async getAttributes(categoryId: string): Promise<any> {
        try {
            const attributes = await Attribute.find(
                {
                    category_id: categoryId,
                    is_deleted: false
                }, {
                    is_deleted: 0,
                    __v: 0
                })
            return attributes;
        } catch {
            return null;
        }
    }
}

export default new AttributeRepo();
