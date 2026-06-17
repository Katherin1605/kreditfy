import { Router } from "express";
import { getRates } from "../src/controllers/exchangeRatesController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/exchange-rates", authenticateToken, getRates);

export default router;
