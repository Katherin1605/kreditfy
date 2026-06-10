import { Router } from "express";
import {
  getAllShopping,
  getShoppingById,
  getShoppingByProductId,
  createShopping,
  deleteShopping,
} from "../src/controllers/shoppingController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/shopping", authenticateToken, getAllShopping);
router.get("/shopping/product/:product_id", authenticateToken, getShoppingByProductId);
router.get("/shopping/:id", authenticateToken, getShoppingById);
router.post("/shopping", authenticateToken, createShopping);
router.delete("/shopping/:id", authenticateToken, deleteShopping);

export default router;
