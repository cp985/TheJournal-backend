import express from "express";
import * as mainControllers from "../controllers/mainControllers.js";

const router = express.Router();


router.get("/",mainControllers.homeGet); 
router.get("/users",mainControllers.usersGet); 
router.post( "/users/signup",mainControllers.usersSignUp); 
router.post("/users/login",mainControllers.usersLogin);
router.post("/dossiers",mainControllers.dossiersPost);
router.get("/dossiers",mainControllers.dossiersGet);
router.post("/evidences",mainControllers.evidencesPost);

export default router;
