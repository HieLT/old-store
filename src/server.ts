import express from "express";
import { config } from "dotenv";
import connect from "./db/db";
import route from "./routes/index.route";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import session from 'express-session';
import * as http from "http";
import { Server } from "socket.io";
import connectSocket from "./services/socket";
import './cron/cronJob'

config();

const hostname = "localhost";
const port = 8080;
const fe_access = process.env.FE_ACCESS;

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: `*`,
        credentials: true,
    },
});

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
connect();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    })
);
app.use(
    cors({
        origin: [`${fe_access}`, `${process.env.BASE_URL}`],
        methods: "GET,POST,PUT,PATCH,DELETE",
        credentials: true,
    })
);
app.use(session({
    secret: String(process.env.WEB_NAME), 
    resave: false, 
    saveUninitialized: false,  
    cookie: {
        httpOnly: true,  
        maxAge: 3600000  
    }
}));

route(app);
connectSocket(io);

const assignSocketToReq = (req: any, res: Response, next: Function) => {
    req.io = io;
    next();
};
app.use(assignSocketToReq as any);

server.listen(port, () => {
    console.log(`Server running at ${process.env.BASE_URL}`);
});
