import { Router } from "express";
import { getMonthlySummary, updateClosing, getAvailableYears } from "../src/controllers/earningsController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/earnings/monthly",          authenticateToken, getMonthlySummary);
router.get("/earnings/years",            authenticateToken, getAvailableYears);
router.put("/earnings/:year/:month",     authenticateToken, updateClosing);

export default router;
