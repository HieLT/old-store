import { Request, Response } from "express";
import BabyRepo from '../repositories/baby.repository';
import { IUser } from '../models/user';
import { IBaby } from "../models/baby";


interface CustomRequest extends Request {
    account?: any;
}

class BabyController {
    async getBabies(req: CustomRequest, res: Response): Promise<void> {
        try {
            const user = req.account as IUser;

            const babies = await BabyRepo.getBabies(String(user._id));

            res.status(200).send(babies);
        } catch (err) {
            res.status(400).send(err);
        }
    }

    async createBaby(req: CustomRequest, res: Response): Promise<void> {
        try {
            const user = req.account as IUser;

            let baby = req.body as IBaby;
            baby.parent_id = user._id;
            
            try {
                const result = await BabyRepo.createBaby(baby);
                res.status(201).send('Tạo mới thành công');
            }
            catch (err: any) {
                const message = Object.values(err.errors).map((e: any) => {
                    if (e.name === 'CastError') return 'Ngày sinh không hợp lệ';
                    else return e.message;
                });
                res.status(400).send(message);
            }
        } catch (err: any) {
            res.status(400).send(err.message);
        }

    }
    async updateBaby(req: CustomRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const baby = req.body
            const user = req.account as IUser;

            const getBaby = await BabyRepo.getBaby(id);

            if (!getBaby) {
                res.status(404).send('Không tìm thấy baby');
                return;
            }

            if (String(getBaby?.parent_id) !== String(user._id)) {
                res.status(403).send('Không có quyền sửa đổi');
                return;
            }
            else {
                try {
                    const result = await BabyRepo.updateBaby(id, baby);
                    if (result) res.status(200).send('Cập nhật thành công');
                    else res.status(400).send('Không tìm thấy babyId');
                }
                catch (err: any) {
                    const message = Object.values(err.errors).map((e: any) => {
                        if (e.name === 'CastError') return 'Ngày sinh không hợp lệ';
                        else return e.message;
                    });
                    res.status(400).send(message);
                }
            }
        } catch (err) {
            res.status(400).send(err);
        }
    }

    async deleteBaby(req: CustomRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = req.account as IUser;

            const getBaby = await BabyRepo.getBaby(id);

            if (!getBaby) {
                res.status(404).send('Không tìm thấy baby');
                return;
            }

            if (String(getBaby?.parent_id) !== String(user._id)) {
                res.status(403).send('Không có quyền xóa');
            }
            else {
                const result = await BabyRepo.updateBaby(id, { is_deleted: true });
                if (result) res.status(200).send('Xóa thành công');
                else res.status(400).send('Không tìm thấy babyId');
            }
        } catch (err) {
            res.status(400).send(err);
        }
    }
}



export default new BabyController;
