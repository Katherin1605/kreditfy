import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../src/controllers/productsController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/products", authenticateToken, resolveTenant, getProducts);
router.get("/products/:id", authenticateToken, resolveTenant, getProductById);
router.post("/products", authenticateToken, resolveTenant, createProduct);
router.put("/products/:id", authenticateToken, resolveTenant, updateProduct);
router.delete("/products/:id", authenticateToken, resolveTenant, deleteProduct);

export default router;
