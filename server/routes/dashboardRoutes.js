import { Router } from "express";
import { getStats, getMonthlyStats } from "../src/controllers/dashboardController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard/stats",         authenticateToken, getStats);
router.get("/dashboard/monthly-stats", authenticateToken, getMonthlyStats);

export default router;
