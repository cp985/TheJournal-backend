import express from "express";
import * as mainControllers from "../controllers/mainControllers.js";

const router = express.Router();
const path = process.env.NODE_ENV === "development" ? "" : process.env.URL_RENDER


router.get(path + "/",mainControllers.homeGet); 
router.get(path + "/users",mainControllers.usersGet); 
router.post( path + "/users",mainControllers.usersPost); 


export default router;
