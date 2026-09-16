import { Router } from "express";
import { getSettings, updateLowStockThreshold, uploadLogo } from "../src/controllers/settingsController.js";
import { authenticateToken, requireSuperAdmin } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/settings", authenticateToken, resolveTenant, getSettings);
router.put("/settings/low-stock", authenticateToken, resolveTenant, requireSuperAdmin, updateLowStockThreshold);
router.post("/settings/logo", authenticateToken, resolveTenant, requireSuperAdmin, ...uploadLogo);

export default router;
