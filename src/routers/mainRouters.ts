import express from "express";
import * as mainControllers from "../controllers/mainControllers.js";

const router = express.Router();


router.get("/",mainControllers.homeGet); 
router.post("/user/email",mainControllers.usersByEmail);
router.get("/users",mainControllers.usersGet); 
router.post("/users/signup",mainControllers.usersSignUp); 
router.post("/users/login",mainControllers.usersLogin);
router.post('/users/oauth-sync',mainControllers.usersOAuthSync);
router.post("/dossiers",mainControllers.dossiersPost);
router.get("/dossiers",mainControllers.dossiersGet);
router.post("/evidences",mainControllers.evidencesPost);
router.get("/evidences/user",mainControllers.authenticateToken,mainControllers.evidencesByUserId);

router.post("/contact",mainControllers.emailResend);


export default router;
