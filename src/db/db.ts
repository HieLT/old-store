const mongoose = require('mongoose');
import * as dotenv from 'dotenv';
dotenv.config();

async function connect() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("Successfully connected to database!");
    }
    catch(err:any) {
        console.error('Error connecting to MongoDB:', err.message);
    }
}

export default connect;