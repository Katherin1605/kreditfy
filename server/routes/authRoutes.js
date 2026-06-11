import { Router } from "express";
import { login, refreshToken } from "../src/controllers/authController.js";

const router = Router();

router.post("/auth/login",   login);
router.post("/auth/refresh", refreshToken);

export default router;
