import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserRepo from "../repositories/user.repository";
import AdminRepo from "../repositories/admin.repository";
import {ACCOUNT_ROLE} from "../utils/enum";

interface CustomRequest extends Request {
    account?: any;  
}

const accessSecret = process.env.ACCESS_SECRET_KEY!;

const authentication = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ message: "Không có token" });
        }
        const decoded = jwt.verify(token, accessSecret) as JwtPayload;
        const account_role = decoded.account_role;
        const payload = account_role === ACCOUNT_ROLE.USER ? decoded.email : decoded.username

        if (account_role === ACCOUNT_ROLE.USER) {
            req.account = await UserRepo.getUserByEmail(payload);
        } else {
            req.account = await AdminRepo.getAdminByUsername(payload);
        }
        req.account.account_role = account_role;
        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).send({ message: 'accessToken đã hết hạn' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).send({ message: 'accessToken không hợp lệ' });
        }
        res.status(500).send({ message: err.message });
    }
};

export default authentication;
