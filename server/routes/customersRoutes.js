import { Router } from "express";
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  importCustomers,
} from "../src/controllers/customersController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/customers", authenticateToken, resolveTenant, getCustomers);
router.get("/customers/:id", authenticateToken, resolveTenant, getCustomerById);
router.post("/customers/import", authenticateToken, resolveTenant, importCustomers);
router.post("/customers", authenticateToken, resolveTenant, createCustomer);
router.put("/customers/:id", authenticateToken, resolveTenant, updateCustomer);
router.delete("/customers/:id", authenticateToken, resolveTenant, deleteCustomer);

export default router;
