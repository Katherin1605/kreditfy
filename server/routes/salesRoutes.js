import { Router } from "express";
import { createSale } from "../src/controllers/salesController.js";

const router = Router();

router.post("/sales", createSale);

export default router;