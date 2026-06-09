import { Router } from "express";
import {
  getPayments,
  getPaymentById,
  getPaymentsBySaleId,
  createPayment,
  deletePayment,
} from "../src/controllers/paymentsController.js";

const router = Router();

router.get("/payments", getPayments);
router.get("/payments/sale/:sale_id", getPaymentsBySaleId);
router.get("/payments/:id", getPaymentById);
router.post("/payments", createPayment);
router.delete("/payments/:id", deletePayment);

export default router;
