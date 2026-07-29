import express from "express";
import router from "./routers/mainRouters.js"
import cors from "cors"
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors( {
    origin: process.env.NODE_ENV === "development" ? "http://localhost:3000" : process.env.VERCEL_URL,
    credentials: true
}));



app.use(router);

app.listen(8080, () => {
    console.log("Server started on port 3000");
});