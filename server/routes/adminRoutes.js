import { Router } from "express";
import {
  getAdmins, getAdminById, createAdmin, updateAdmin, deleteAdmin,
  toggleAdminActive, updateAdminPermissions,
} from "../src/controllers/adminController.js";
import { authenticateToken, requireSuperAdmin } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/admins", authenticateToken, resolveTenant, getAdmins);
router.get("/admins/:id", authenticateToken, resolveTenant, getAdminById);
router.post("/admins", authenticateToken, resolveTenant, requireSuperAdmin, createAdmin);
router.put("/admins/:id", authenticateToken, resolveTenant, updateAdmin);
router.delete("/admins/:id", authenticateToken, resolveTenant, requireSuperAdmin, deleteAdmin);
router.patch("/admins/:id/active", authenticateToken, resolveTenant, requireSuperAdmin, toggleAdminActive);
router.patch("/admins/:id/permissions", authenticateToken, resolveTenant, requireSuperAdmin, updateAdminPermissions);

export default router;
