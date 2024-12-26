import { Types } from "mongoose";
import Admin, { IAdmin } from "../models/admin";
import bcrypt from "bcrypt";

const {ObjectId} = Types

class AdminRepo {
    async getAdminByUsername(username: string): Promise<any> {
        try {
            const admin = await Admin.findOne({ username })
            return admin;
        }
        catch (err) {
            throw err;
        }
    }
    async searchAdmin(
        searchKey: string ='',
        page: number = 1,
        limit: number = 10
    ): Promise<any> {
        try {
            const searchQuery = {
                role: 'admin',
                $or: [
                    { firstname: { $regex: searchKey, $options: 'i' } },
                    { lastname: { $regex: searchKey, $options: 'i' } },
                ]
            }
            const admins = await Admin
                .find(searchQuery)
                .skip((page - 1) * limit)
                .limit(limit) // Limit number of documents per page
                .exec();
            
            const total= await Admin.countDocuments(searchQuery);

            return {admins, total};
        } catch (err) {
            throw err;
        }
    }
    async createAdmin(admin: Partial<IAdmin>): Promise<boolean> {
        try {
            const create: Partial<IAdmin> = { ...admin };

            create.password = bcrypt.hashSync(admin.password!, 10);
            create.role = 'admin';

            const result = await Admin.create(create);

            return result ? true : false;
        } catch (err) {
            throw err;
        }
    }


    async updateAdmin(id: string, admin: Partial<IAdmin>): Promise<boolean> {
        try {
            const update: Partial<IAdmin> = { ...admin };

            if (admin.password) update.password = bcrypt.hashSync(admin.password!, 10);

            const result = await Admin.findOneAndUpdate({ _id: new ObjectId(id) }, update);

            return result ? true : false;

        } catch (err) {
            throw err;
        }
    }
    async deleteAdmin(adminId: string): Promise<boolean> {
        try {
            const result = await Admin.findByIdAndUpdate({ _id: adminId }, { is_deleted: true });

            return result ? true : false;

        } catch (err) {
            throw err;
        }
    }
    async restoreAdmin(adminId: string): Promise<boolean> {
        try {
            const result = await Admin.findByIdAndUpdate({ _id: adminId }, { is_deleted: false });

            return result ? true : false;

        } catch (err) {
            throw err;
        }
    }
}
export default new AdminRepo();