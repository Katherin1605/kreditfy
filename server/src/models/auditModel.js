import pool from "../../db/config.js";

export const getAllAuditLogs = async () => {
  const result = await pool.query(
    `SELECT al.*, a.name AS admin_name
     FROM audit_logs al
     LEFT JOIN admins a ON al.admin_id = a.id
     ORDER BY al.created_at DESC`
  );
  return result.rows;
};

export const getAuditLogById = async (id) => {
  const result = await pool.query("SELECT * FROM audit_logs WHERE id = $1", [id]);
  return result.rows[0];
};

export const getAuditLogsByAdmin = async (admin_id) => {
  const result = await pool.query(
    "SELECT * FROM audit_logs WHERE admin_id = $1 ORDER BY created_at DESC",
    [admin_id]
  );
  return result.rows;
};

export const getAuditLogsByTable = async (table_name) => {
  const result = await pool.query(
    "SELECT * FROM audit_logs WHERE table_name = $1 ORDER BY created_at DESC",
    [table_name]
  );
  return result.rows;
};

export const createAuditLog = async (data) => {
  const { admin_id, action, table_name, record_id, description } = data;
  const result = await pool.query(
    `INSERT INTO audit_logs (admin_id, action, table_name, record_id, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [admin_id ?? null, action, table_name, record_id ?? null, description ?? null]
  );
  return result.rows[0];
};
