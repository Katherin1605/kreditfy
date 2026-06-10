import { Router } from "express";
import {
  getPayments,
  getPaymentById,
  getPaymentsBySaleId,
  createPayment,
  deletePayment,
} from "../src/controllers/paymentsController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/payments", authenticateToken, getPayments);
router.get("/payments/sale/:sale_id", authenticateToken, getPaymentsBySaleId);
router.get("/payments/:id", authenticateToken, getPaymentById);
router.post("/payments", authenticateToken, createPayment);
router.delete("/payments/:id", authenticateToken, deletePayment);

export default router;
