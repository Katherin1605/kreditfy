import { Router } from "express";
import {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByAdmin,
  getAuditLogsByTable,
  createAuditLog,
} from "../src/controllers/auditController.js";
import { authenticateToken } from "../src/middleware/authMiddleware.js";

const router = Router();

router.get("/audit", authenticateToken, getAllAuditLogs);
router.get("/audit/admin/:admin_id", authenticateToken, getAuditLogsByAdmin);
router.get("/audit/table/:table_name", authenticateToken, getAuditLogsByTable);
router.get("/audit/:id", authenticateToken, getAuditLogById);
router.post("/audit", authenticateToken, createAuditLog);

export default router;
