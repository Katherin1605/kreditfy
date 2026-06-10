import { Router } from "express";
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../src/controllers/customersController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/customers", authenticateToken, getCustomers);
router.get("/customers/:id", authenticateToken, getCustomerById);
router.post("/customers", authenticateToken, createCustomer);
router.put("/customers/:id", authenticateToken, updateCustomer);
router.delete("/customers/:id", authenticateToken, deleteCustomer);

export default router;
