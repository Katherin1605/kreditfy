import { Router } from "express";
import { login, refreshToken, forgotPassword, resetPassword, registerTenant, switchTenant } from "../src/controllers/authController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.post("/auth/login",            login);
router.post("/auth/refresh",          refreshToken);
router.post("/auth/forgot-password",  forgotPassword);
router.post("/auth/reset-password",   resetPassword);
router.post("/auth/register-tenant",  registerTenant);
router.post("/auth/switch",           authenticateToken, switchTenant);

export default router;
