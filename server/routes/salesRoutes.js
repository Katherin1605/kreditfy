import { Router } from "express";
import { getSales, getSaleById, createSale, updateSale, deleteSale } from "../src/controllers/salesController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/sales", authenticateToken, getSales);
router.get("/sales/:id", authenticateToken, getSaleById);
router.post("/sales", authenticateToken, createSale);
router.put("/sales/:id", authenticateToken, updateSale);
router.delete("/sales/:id", authenticateToken, deleteSale);

export default router;
