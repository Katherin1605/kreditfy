import { Router } from "express";
import { getSales, getSaleById, createSale, updateSale, deleteSale } from "../src/controllers/salesController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/sales", authenticateToken, resolveTenant, getSales);
router.get("/sales/:id", authenticateToken, resolveTenant, getSaleById);
router.post("/sales", authenticateToken, resolveTenant, createSale);
router.put("/sales/:id", authenticateToken, resolveTenant, updateSale);
router.delete("/sales/:id", authenticateToken, resolveTenant, deleteSale);

export default router;
