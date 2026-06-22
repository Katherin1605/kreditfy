import { Router } from "express";
import { getMonthlySummary, updateClosing, getAvailableYears } from "../src/controllers/earningsController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/earnings/monthly",          authenticateToken, resolveTenant, getMonthlySummary);
router.get("/earnings/years",            authenticateToken, resolveTenant, getAvailableYears);
router.put("/earnings/:year/:month",     authenticateToken, resolveTenant, updateClosing);

export default router;
