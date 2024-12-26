import { NextFunction, Request, Response } from "express";
import { IAdmin } from "../models/admin";
import {ADMIN_ROLE} from "../utils/enum";

interface CustomRequest extends Request {
    account?: any;  
}

const isAdmin = (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const account = req.account as IAdmin;
        if (account.role !== ADMIN_ROLE.ADMIN && account.role !== ADMIN_ROLE.SUPER_ADMIN) {
            return res.status(403).send('Không có quyền truy cập')
        }

        if (account.is_deleted) {
            return res.status(403).send('Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên');
        }

        return next()
    } catch (err: any) {
        res.status(500).send({ message: err.message });
    }
};

export default isAdmin;
