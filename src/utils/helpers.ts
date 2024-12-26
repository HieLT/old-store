import { readFileSync } from "fs";
import Handlebars from "handlebars";
import Joi from "joi";
import moment from "moment";
import {Types} from "mongoose";
import path from "path";
const {ObjectId} = Types

export const getDetailErrorMessage = (error: Joi.ValidationError): any => {
    let details = {}
    error.details?.forEach((err: Joi.ValidationErrorItem) => {
        let key = err.context?.key
        if (key) {
            details = {
                ...details,
                [key]: err.message
            }
        }
    })

    return details
}

export const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export const checkIsObjectId = (str: string): boolean => {
    return ObjectId.isValid(str)
}

export const checkIfTwoArrayEqualsUnordered = (arr1: string[], arr2: string[]): boolean => {
    if (arr1?.length !== arr2?.length) {
        return false
    }

    const elementCount: Map<string, number> = new Map()
    arr1.forEach((item: string) => {
        elementCount.set(item, (elementCount.get(item) || 0) + 1)
    })

    arr2.forEach((item: string) => {
        if (!elementCount.has(item)) {
            return false
        }
        // @ts-ignore
        elementCount.set(item, elementCount.get(item) - 1)
        if (elementCount.get(item) === 0) {
            elementCount.delete(item)
        }
    })

    return elementCount.size === 0
}

export const countDuplicateValue = (arr: any, keyInObject: string | null = null): string[] => {
    let countValues: any = {}
    let duplicateValues: any = []
    if (arr?.length > 0) {
        arr?.forEach((item: any) => {
            let value = keyInObject ? item[keyInObject] : item
            if (typeof value === 'string') {
                value = value.toLowerCase()
            }
            if (!countValues?.[value]) {
                countValues[value] = 1
            } else {
                countValues[value] += 1
            }
        })
        Object.keys(countValues)?.forEach(key => {
            if (countValues[key] > 1) {
                duplicateValues = [...duplicateValues, key]
            }
        })
        return duplicateValues
    }
    return []
}

export const getOneMonthLater = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiredDate = new Date(today);
    expiredDate.setDate(today.getDate() + 30);
    return expiredDate;
}

export const formatExpiredDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `00:00 ${day}/${month}/${year}`;
}

export const compileTemplate = (templatePath: string, data: object): string => {
    const templateContent = readFileSync(path.resolve(templatePath), 'utf8');
    const template = Handlebars.compile(templateContent);
    return template(data);
};

export const getTimeFormat = (groupingType: string): string => {
    switch (groupingType) {
        case "week":
            return "%Y-%U"; // Year-Week (e.g., 2024-23)
        case "month":
            return "%Y-%m"; // Year-Month (e.g., 2024-11)
        case "year":
            return "%Y"; // Year (e.g., 2024)
        default:
            return "%Y-%m"; // Default to month if invalid
    }
};
