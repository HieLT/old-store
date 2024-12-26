import { NextFunction, Request, Response } from "express";
import { IAdmin } from "../models/admin";

interface CustomRequest extends Request {
    account?: any;  
}

const isSuperAdmin = (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const accont = req.account as IAdmin;
        if (accont.role === 'super_admin') return next();

        return res.status(403).send('Tài khoản đã bị khóa, vui lòng liên hệ admin để mở khóa');
            
    } catch (err: any) {
        res.status(500).send({ message: err.message });
    }
};

export default isSuperAdmin;
