import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { TokenExpiredError } from "jsonwebtoken";
import validatePassword from "../utils/validatePassword";
import UserRepo from "../repositories/user.repository";

const secret = process.env.ACCESS_SECRET_KEY!;

class emailVerifyController {
    async emailRegisterVerification(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;
            
            const emailFromToken = jwt.verify(token, secret) as JwtPayload;
            const { email, password, firstname, lastname } = emailFromToken;
            const user = await UserRepo.getUserByEmail(email);
            if (user) {
                res.status(401).send('Người dùng đã tồn tại');
                return;
            }
            const userCreated = await UserRepo.createUser({email, password, firstname, lastname});

            const statusCode = userCreated ? 201 : 400;
            const message = userCreated 
                ? 'Người dùng đã được tạo thành công' 
                : 'Thêm mới người dùng thất bại';

            res.status(statusCode).send(message);

        } catch (err: any) {
            if (err instanceof TokenExpiredError) {
                res.status(400).send('Token đã hết hạn');
            } else if (err.name === 'JsonWebTokenError') {
                res.status(401).send('Token không hợp lệ');
            } else {
                res.status(500);
            }
        }
    }

    async emailResetPasswordVerification(req: Request, res: Response): Promise<void> {
        try {
            const { token, resetPassword } = req.body;

            if (!validatePassword(resetPassword)) {
                res.status(400).send('Mật khẩu không đáp ứng yêu cầu');
                return;
            }
            const emailFromToken = jwt.verify(token, secret) as JwtPayload;
            const { email } = emailFromToken;
            const user = await UserRepo.getUserByEmail(email);

            if (!user) {
                res.status(404).send('Email không tồn tại');
                return
            }

            const result = await UserRepo.updateUser(String(user._id), { password : resetPassword});

            result ? res.status(200).send('Mật khẩu đã được thay đổi') : res.status(400).send('Thay đổi mật khẩu thất bại');
        } catch (err: any) {
            if (err instanceof TokenExpiredError) {
                res.status(400).send('Token đã hết hạn');
            } else if (err.name === 'JsonWebTokenError') {
                res.status(401).send('Token không hợp lệ');
            } else {
                res.status(500);
            }
        }
    }
}

export default new emailVerifyController();
