import { Router } from "express";
import {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByAdmin,
  getAuditLogsByTable,
  createAuditLog,
} from "../src/controllers/auditController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";
import { resolveTenant } from "../src/middleware/resolveTenant.js";

const router = Router();

router.get("/audit", authenticateToken, resolveTenant, getAllAuditLogs);
router.get("/audit/admin/:admin_id", authenticateToken, resolveTenant, getAuditLogsByAdmin);
router.get("/audit/table/:table_name", authenticateToken, resolveTenant, getAuditLogsByTable);
router.get("/audit/:id", authenticateToken, resolveTenant, getAuditLogById);
router.post("/audit", authenticateToken, resolveTenant, createAuditLog);

export default router;
