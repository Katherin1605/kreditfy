import { Router } from "express";
import {
  getAllAuditLogs,
  getAuditLogById,
  getAuditLogsByAdmin,
  getAuditLogsByTable,
  createAuditLog,
} from "../src/controllers/auditController.js";

const router = Router();

router.get("/audit", getAllAuditLogs);
router.get("/audit/admin/:admin_id", getAuditLogsByAdmin);
router.get("/audit/table/:table_name", getAuditLogsByTable);
router.get("/audit/:id", getAuditLogById);
router.post("/audit", createAuditLog);

export default router;
