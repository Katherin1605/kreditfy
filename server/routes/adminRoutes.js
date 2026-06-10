import { Router } from "express";
import {
  getAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin,
  toggleAdminActive, updateAdminPermissions,
} from "../src/controllers/adminController.js";
import { authenticateToken, requireSuperAdmin } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/admins", authenticateToken, getAdmins);
router.get("/admins/:id", authenticateToken, getAdminById);
router.post("/admins", authenticateToken, requireSuperAdmin, createAdmin);
router.put("/admins/:id", authenticateToken, updateAdmin);
router.delete("/admins/:id", authenticateToken, requireSuperAdmin, deleteAdmin);
router.patch("/admins/:id/active", authenticateToken, requireSuperAdmin, toggleAdminActive);
router.patch("/admins/:id/permissions", authenticateToken, requireSuperAdmin, updateAdminPermissions);

export default router;
