import { Router } from "express";
import {
  getAllShopping,
  getShoppingById,
  getShoppingByProductId,
  createShopping,
  deleteShopping,
} from "../src/controllers/shoppingController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/shopping", authenticateToken, resolveTenant, getAllShopping);
router.get("/shopping/product/:product_id", authenticateToken, resolveTenant, getShoppingByProductId);
router.get("/shopping/:id", authenticateToken, resolveTenant, getShoppingById);
router.post("/shopping", authenticateToken, resolveTenant, createShopping);
router.delete("/shopping/:id", authenticateToken, resolveTenant, deleteShopping);

export default router;
