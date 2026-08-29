import express from "express";
import * as mainControllers from "../controllers/mainControllers.js";
import {uploadSingleFile} from "../lib/multerUpload.js";
const router = express.Router();


router.get("/",mainControllers.homeGet); 
router.post("/user/email",mainControllers.usersByEmail);
router.delete("/users/admin",mainControllers.authenticateAdminToken,mainControllers.userDeleteAdmin);
router.patch("/users/admin",mainControllers.authenticateAdminToken,mainControllers.adminUpdateUserRole);
router.get("/users",mainControllers.authenticateAdminToken,mainControllers.usersGet); 
router.patch("/users",mainControllers.authenticateToken,mainControllers.usersPatch);
router.post("/users/signup",mainControllers.usersSignUp); 
router.post("/users/login",mainControllers.usersLogin);
router.post('/users/oauth-sync',mainControllers.usersOAuthSync);
router.delete("/users/me",mainControllers.authenticateToken,mainControllers.usersDelete);
router.get("/users/me/export",mainControllers.authenticateToken,mainControllers.exportUserData);

router.post("/dossiers/admin",mainControllers.authenticateAdminToken,mainControllers.dossiersPostAdmin);
router.patch("/dossiers/admin",mainControllers.authenticateAdminToken,mainControllers.dossierPatchAdmin)
router.delete("/dossiers/admin",mainControllers.authenticateAdminToken,mainControllers.dossierDeleteAdmin)
router.get("/dossiers",mainControllers.optionalAuth,mainControllers.dossiersGet);

router.post("/evidences",mainControllers.authenticateToken,uploadSingleFile,mainControllers.evidencesPost);
router.get("/evidences",mainControllers.authenticateAdminToken,mainControllers.evidencesGet);
router.post("/evidences/admin",mainControllers.authenticateAdminToken,uploadSingleFile,mainControllers.evidencesPostAdmin);
router.patch("/evidences/admin",mainControllers.authenticateAdminToken,mainControllers.evidencePatchAdmin);
router.delete("/evidences/admin",mainControllers.authenticateAdminToken,mainControllers.evidenceDeleteAdmin);
router.get("/evidences/user",mainControllers.authenticateToken,mainControllers.evidencesByUserId);

router.post("/contact",mainControllers.emailResend);

router.get("/health",mainControllers.healthGet);


router.post("/map/timelines/admin",mainControllers.authenticateAdminToken,mainControllers.postTimelineSkeletonAdmin);
router.get("/map/timelines/:dossierId",mainControllers.timelineGetWithDossierId);

export default router;
