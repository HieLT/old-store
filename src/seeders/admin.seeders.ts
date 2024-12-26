import {ADMIN_ROLE} from "../utils/enum";
import Admin from "../models/admin";
import bcrypt from "bcrypt";

const superAdmin = {
    firstname: null,
    lastname: null,
    avatar: null,
    username: 'super-admin',
    password: 'Superadmin@123',
    role: ADMIN_ROLE.SUPER_ADMIN
}

export default async function () {
    try {
        await Admin.findOneAndUpdate({username: superAdmin.username}, {
            ...superAdmin,
            password: bcrypt.hashSync(superAdmin.password, 10)
        }, {upsert: true, new: true})
        console.log("Seed super admin successfully.");
        process.exit(0);
    } catch (err) {
        console.log(err);
        process.exit(0)
    }
}
