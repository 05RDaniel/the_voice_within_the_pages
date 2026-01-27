import { Router } from "express";
import { login, register, logout, getMe, updateProfileImage, changePassword } from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/me", getMe);
router.put("/profile-image", updateProfileImage);
router.put("/change-password", changePassword);

export default router;

