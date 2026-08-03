import express from "express";
import * as mainControllers from "../controllers/mainControllers.js";

const router = express.Router();


router.get("/",mainControllers.homeGet); 
router.get("/users",mainControllers.usersGet); 
router.post( "/users",mainControllers.usersPost); 
router.post("/dossiers",mainControllers.dossiersPost);

export default router;
