import connectDb from "../db/db";
import adminSeeders from "./admin.seeders";

async function seed() {
    try {
        await connectDb();
        await adminSeeders();
        console.log("Seed done.");
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

seed();
