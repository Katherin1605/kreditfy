import { Router } from "express";
import { getStats } from "../src/controllers/dashboardController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard/stats", authenticateToken, getStats);

export default router;
