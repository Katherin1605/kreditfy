import { Router } from "express";
import { login, refreshToken, forgotPassword, resetPassword } from "../src/controllers/authController.js";

const router = Router();

router.post("/auth/login",            login);
router.post("/auth/refresh",          refreshToken);
router.post("/auth/forgot-password",  forgotPassword);
router.post("/auth/reset-password",   resetPassword);

export default router;
