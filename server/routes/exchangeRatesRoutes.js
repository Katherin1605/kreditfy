import { Router } from "express";
import { getRates } from "../src/controllers/exchangeRatesController.js";

const router = Router();

router.get("/exchange-rates", getRates);

export default router;
