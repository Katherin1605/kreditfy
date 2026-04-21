import { Router } from "express";
import { getCustomers, createCustomer } from "../src/controllers/customersController.js";

const router = Router();

router.get("/customers", getCustomers);
router.post("/customers", createCustomer);

export default router;