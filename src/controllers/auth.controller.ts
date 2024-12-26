import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import mail from "../services/mail";
import UserRepo from "../repositories/user.repository";
import AdminRepo from "../repositories/admin.repository";
import bcrypt from "bcrypt";
import validatePassword from "../utils/validatePassword";
import validateEmail from "email-validator";
import passport from "../utils/passport";
import { ACCOUNT_ROLE } from "../utils/enum";

interface CustomRequest extends Request {
    account?: any;
}

const fe_access = process.env.FE_ACCESS;
const accessSecret = process.env.ACCESS_SECRET_KEY!;
const refreshSecret = process.env.REFRESH_SECRET_KEY!;

const createToken = (
    payload: object,
    expiresIn: string,
    secretKey: string
): string => {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, secretKey, options);
};

const handleRefuseLogin = (res: Response, account: any): void => {
    if (!account) {
        res.status(400).send("Tài khoản không tồn tại");
    } else if (account.is_deleted) {
        res.status(403).send(
            "Người dùng đã bị xóa, liên hệ quản trị viên để mở khóa"
        );
    } else if (account.is_google_account) {
        res.status(422).send(
            "Tài khoản Google không hợp lệ, vui lòng đăng nhập lại"
        );
    } else {
        res.status(401).send("Email hoặc mật khẩu không chính xác");
    }
};

const sendEmail = async (
    email: string,
    subject: string,
    message: string,
    res: Response
): Promise<void> => {
    try {
        await mail.sendMail({ email, subject, message });
        res.status(201).json({
            success: true,
            message: `Vui lòng kiểm tra email của bạn: ${email} để kích hoạt tài khoản`,
        });
    } catch (err: any) {
        res.status(500).send("Không thể gửi được email");
    }
};

const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string,
    userProfile: any
): void => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        sameSite: "lax" as const,
        maxAge: 3600000,
    };
    res.cookie("access_token", accessToken, cookieOptions);
    res.cookie("refresh_token", refreshToken, cookieOptions);
    res.cookie("user_profile", JSON.stringify(userProfile), cookieOptions);
};

class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, firstname, lastname } = req.body;

            if (!email || !validateEmail.validate(email)) {
                res.status(400).send("Email không đáp ứng yêu cầu");
                return;
            }
            const userExisted = await UserRepo.getUserByEmail(email);

            if (userExisted) {
                res.status(400).send("Người dùng đã tồn tại");
                return;
            }
            if (!password || !validatePassword(password)) {
                res.status(400).send("Mật khẩu không đáp ứng yêu cầu");
                return;
            }

            const activationToken = createToken(
                { email, password, firstname, lastname },
                "3d",
                accessSecret
            );
            const activationUrl = `${fe_access}/verify-email/${activationToken}`;
            const message = `Xin chào, vui lòng nhấp vào liên kết này để kích hoạt tài khoản của bạn: ${activationUrl}`;
            await sendEmail(email, "Xác nhận tài khoản của bạn", message, res);
        } catch (err) {
            res.status(500);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, account_role, username } = req.body;
            if (!account_role) {
                res.status(400).send("Thiếu account_role");
                return;
            }
            if (
                account_role === ACCOUNT_ROLE.USER &&
                (!email || !validateEmail.validate(email))
            ) {
                res.status(400).send("Email không đáp ứng yêu cầu");
                return;
            }

            if (!password) {
                res.status(400).send("Mật khẩu không được bỏ trống");
                return;
            }

            //accont_role :  admin or user
            let account;
            if (account_role === ACCOUNT_ROLE.USER)
                account = await UserRepo.getUserByEmail(email);
            else account = await AdminRepo.getAdminByUsername(username);

            if (!account || account.is_google_account || account.is_delete) {
                handleRefuseLogin(res, account);
                return;
            }

            const isPasswordCorrect = await bcrypt.compare(
                password,
                account.password!
            );

            if (!isPasswordCorrect) {
                res.status(401).send(
                    `${
                        account_role === ACCOUNT_ROLE.USER
                            ? "Email"
                            : "Username"
                    } hoặc mật khẩu không chính xác`
                );
                return;
            }

            if (account?.is_deleted) {
                res.status(403).send(
                    "Tài khoản đã bị khóa, vui lòng liên hệ admin để mở khóa"
                );
                return;
            }

            const actorPayload =
                account_role === ACCOUNT_ROLE.USER ? { email } : { username };
            const accessToken = createToken(
                { ...actorPayload, account_role },
                "15m",
                accessSecret
            );
            const refreshToken = createToken(
                { ...actorPayload, account_role },
                "7d",
                refreshSecret
            );

            res.status(200).send({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        } catch (err: any) {
            res.status(500).send(err.message);
        }
    }
    async changePassWord(req: CustomRequest, res: Response): Promise<void> {
        try {
            const { oldPassword, newPassword } = req.body;
            const account = req.account;

            if (!validatePassword(newPassword)) {
                res.status(400).send("Mật khẩu mới không đáp ứng yêu cầu");
                return;
            }

            const isPasswordCorrect = await bcrypt.compare(
                oldPassword,
                account.password!
            );
            if (!isPasswordCorrect) {
                res.status(400).send("Mật khẩu không chính xác");
                return;
            }

            if (account.account_role === ACCOUNT_ROLE.USER)
                await UserRepo.updateUser(account._id, {
                    password: newPassword,
                });
            else
                await AdminRepo.updateAdmin(account._id, {
                    password: newPassword,
                });

            res.status(200).send("Cập nhật thành công");
        } catch {
            res.status(500);
        }
    }

    getNewAccessToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;
            const decoded = jwt.verify(
                refreshToken,
                refreshSecret
            ) as JwtPayload;
            const account_role = decoded.account_role;
            const payload =
                account_role === ACCOUNT_ROLE.USER
                    ? { email: decoded.email }
                    : { username: decoded.username };

            const newAccessToken = createToken(
                { ...payload, account_role },
                "15m",
                accessSecret
            );
            const newRefreshToken = createToken(
                { ...payload, account_role },
                "7d",
                refreshSecret
            );

            res.status(200).send({
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
            });

            res.status(200);
        } catch (err: any) {
            if (err.name === "TokenExpiredError") {
                return res
                    .status(401)
                    .send({ message: "refreshToken đã hết hạn" });
            }
            if (err.name === "JsonWebTokenError") {
                return res
                    .status(401)
                    .send({ message: "refreshToken không hợp lệ" });
            }
            res.status(500);
        }
    }
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;

            if (!validateEmail.validate(email)) {
                res.status(400).send("Email không đáp ứng yêu cầu");
                return;
            }

            const user = await UserRepo.getUserByEmail(email);

            if (!user) {
                res.status(401).send("Email không tồn tại");
                return;
            }

            if (user.is_google_account) {
                res.status(403).send(
                    "Tài khoản google không thể thay đổi mật khẩu"
                );
                return;
            }

            const resetPasswordToken = createToken(
                { email },
                "5m",
                accessSecret
            );
            const resetPasswordUrl = `${fe_access}/reset-password?token=${resetPasswordToken}&expired_within=${"300"}`;
            const message = `Xin chào, vui lòng nhấp vào liên kết này để đặt lại mật khẩu của bạn: ${resetPasswordUrl}`;

            await sendEmail(email, "Đặt lại mật khẩu của bạn", message, res);
        } catch (err) {
            res.status(500);
        }
    }

    loginGoogle(req: Request, res: Response, next: NextFunction): void {
        passport.authenticate("google", {
            scope: ["email", "profile"],
            prompt: 'consent'
        })(req, res, next);
    }

    callbackGoogle(req: Request, res: Response, next: NextFunction): void {
        passport.authenticate(
            "google",
            async (err: any, user: Express.User, info: any) => {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.redirect("fail");
                }

                const email = (user as { email: string }).email;
                const userProfile = await UserRepo.getUserByEmail(email);
                const accessToken = createToken(
                    { email, account_role: ACCOUNT_ROLE.USER },
                    "15m",
                    accessSecret
                );
                const refreshToken = createToken(
                    { email, account_role: ACCOUNT_ROLE.USER },
                    "7d",
                    refreshSecret
                );
                delete userProfile.password;
                setAuthCookies(res, accessToken, refreshToken, userProfile);

                return res.redirect(`${fe_access}`);
            }
        )(req, res, next);
    }
}

export default new AuthController();
