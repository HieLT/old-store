import { NextFunction, Request, Response } from "express";

interface CustomRequest extends Request {
    account?: any;  
}

const isNotDeleted = (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const account = req.account ;

        if (account.is_deleted === false) return next();

        return res.status(403).send('Tài khoản đã bị khóa, vui lòng liên hệ admin để mở khóa');
            
    } catch (err: any) {
        res.status(500).send({ message: err.message });
    }
};

export default isNotDeleted;
