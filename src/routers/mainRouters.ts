import express from "express";
import * as mainControllers from "../controllers/mainControllers.js";
import {uploadSingleFile} from "../lib/multerUpload.js";
const router = express.Router();


router.get("/",mainControllers.homeGet); 
router.post("/user/email",mainControllers.usersByEmail);
router.get("/users",mainControllers.authenticateToken,mainControllers.usersGet); 
router.patch("/users",mainControllers.authenticateToken,mainControllers.usersPatch);
router.post("/users/signup",mainControllers.usersSignUp); 
router.post("/users/login",mainControllers.usersLogin);
router.post('/users/oauth-sync',mainControllers.usersOAuthSync);
router.delete("/users/me",mainControllers.authenticateToken,mainControllers.usersDelete);
router.get("/users/me/export",mainControllers.authenticateToken,mainControllers.exportUserData);
router.post("/dossiers",mainControllers.dossiersPost);
router.get("/dossiers",mainControllers.authenticateToken,mainControllers.dossiersGet);
router.post("/evidences",mainControllers.authenticateToken,uploadSingleFile,mainControllers.evidencesPost);
router.get("/evidences/user",mainControllers.authenticateToken,mainControllers.evidencesByUserId);

router.post("/contact",mainControllers.emailResend);


export default router;
