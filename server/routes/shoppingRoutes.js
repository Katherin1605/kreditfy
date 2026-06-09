import { Router } from "express";
import {
  getAllShopping,
  getShoppingById,
  getShoppingByProductId,
  createShopping,
  deleteShopping,
} from "../src/controllers/shoppingController.js";

const router = Router();

router.get("/shopping", getAllShopping);
router.get("/shopping/product/:product_id", getShoppingByProductId);
router.get("/shopping/:id", getShoppingById);
router.post("/shopping", createShopping);
router.delete("/shopping/:id", deleteShopping);

export default router;
