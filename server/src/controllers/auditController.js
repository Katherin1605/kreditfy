import * as auditModel from "../models/auditModel.js";

export const getAllAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 15, q = '', table = '', action = '', date_from = '', date_to = '' } = req.query;
    const data = await auditModel.getAllAuditLogs({ page, limit, q, table, action, date_from, date_to });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los registros de auditoría" });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await auditModel.getAuditLogById(id);
    if (!data) return res.status(404).json({ error: "Registro de auditoría no encontrado" });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el registro de auditoría" });
  }
};

export const getAuditLogsByAdmin = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const data = await auditModel.getAuditLogsByAdmin(admin_id);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los registros de auditoría del administrador" });
  }
};

export const getAuditLogsByTable = async (req, res) => {
  try {
    const { table_name } = req.params;
    const data = await auditModel.getAuditLogsByTable(table_name);
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
    const result = await auditModel.createAuditLog(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    if (error.code === "23514") {
      return res.status(400).json({ error: "Acción inválida. Usa: CREATE, UPDATE o DELETE" });
    }
    res.status(500).json({ error: "Error al crear el registro de auditoría" });
  }
};
