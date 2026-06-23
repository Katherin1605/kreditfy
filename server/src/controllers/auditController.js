import * as auditModel from "../models/auditModel.js";

export const getAllAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 15, q = '', table = '', action = '', date_from = '', date_to = '' } = req.query;
    const data = await auditModel.getAllAuditLogs({ page, limit, q, table, action, date_from, date_to, tenantId: req.tenantId });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los registros de auditoría" });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const data = await auditModel.getAuditLogById(req.params.id, req.tenantId);
    if (!data) return res.status(404).json({ error: "Registro de auditoría no encontrado" });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el registro de auditoría" });
  }
};

export const getAuditLogsByAdmin = async (req, res) => {
  try {
    const data = await auditModel.getAuditLogsByAdmin(req.params.admin_id, req.tenantId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los registros de auditoría del administrador" });
  }
};

export const getAuditLogsByTable = async (req, res) => {
  try {
    const data = await auditModel.getAuditLogsByTable(req.params.table_name, req.tenantId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los registros de auditoría de la tabla" });
  }
};

export const createAuditLog = async (req, res) => {
  try {
    const { action, table_name } = req.body;
    if (!action) return res.status(400).json({ error: "El campo action es obligatorio" });
    if (!table_name) return res.status(400).json({ error: "El campo table_name es obligatorio" });
    const result = await auditModel.createAuditLog({ ...req.body, tenant_id: req.tenantId });
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    if (error.code === "23514") {
      return res.status(400).json({ error: "Acción inválida. Usa: CREATE, UPDATE o DELETE" });
    }
    res.status(500).json({ error: "Error al crear el registro de auditoría" });
  }
};
