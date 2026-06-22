import { Router } from "express";
import {
  getPayments,
  getPaymentById,
  getPaymentsBySaleId,
  createPayment,
  deletePayment,
} from "../src/controllers/paymentsController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/payments", authenticateToken, resolveTenant, getPayments);
router.get("/payments/sale/:sale_id", authenticateToken, resolveTenant, getPaymentsBySaleId);
router.get("/payments/:id", authenticateToken, resolveTenant, getPaymentById);
router.post("/payments", authenticateToken, resolveTenant, createPayment);
router.delete("/payments/:id", authenticateToken, resolveTenant, deletePayment);

export default router;
