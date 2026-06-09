import { Router } from "express";
import { getSales, getSaleById, createSale, updateSale, deleteSale } from "../src/controllers/salesController.js";

const router = Router();

router.get("/sales", getSales);
router.get("/sales/:id", getSaleById);
router.post("/sales", createSale);
router.put("/sales/:id", updateSale);
router.delete("/sales/:id", deleteSale);

export default router;