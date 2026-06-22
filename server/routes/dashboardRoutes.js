import { Router } from "express";
import { getStats, getMonthlyStats } from "../src/controllers/dashboardController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/dashboard/stats",         authenticateToken, resolveTenant, getStats);
router.get("/dashboard/monthly-stats", authenticateToken, resolveTenant, getMonthlyStats);

export default router;
