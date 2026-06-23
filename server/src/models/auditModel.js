import pool from "../../db/config.js";

export const getAllAuditLogs = async ({ page = 1, limit = 15, q = '', table = '', action = '', date_from = '', date_to = '', tenantId } = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];
  let idx = 1;

  if (tenantId != null) {
    conditions.push(`al.tenant_id = $${idx++}`);
    params.push(tenantId);
  }
  if (q) {
    conditions.push(`(a.name ILIKE $${idx} OR al.description ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }
  if (table) {
    conditions.push(`al.table_name = $${idx++}`);
    params.push(table);
  }
  if (action) {
    conditions.push(`al.action = $${idx++}`);
    params.push(action);
  }
  if (date_from) {
    conditions.push(`al.created_at::date >= $${idx++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`al.created_at::date <= $${idx++}`);
    params.push(date_to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, dataRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM audit_logs al LEFT JOIN admins a ON al.admin_id = a.id ${where}`,
      params
    ),
    pool.query(
      `SELECT al.*, a.name AS admin_name
       FROM audit_logs al
       LEFT JOIN admins a ON al.admin_id = a.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    ),
  ]);

  const total = parseInt(countRes.rows[0].count);
  return {
    data:       dataRes.rows,
    total,
    page:       parseInt(page),
    limit:      parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

export const getAuditLogById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM audit_logs ${where}`, params);
  return result.rows[0];
};

export const getAuditLogsByAdmin = async (admin_id, tenantId) => {
  const params = [admin_id];
  let where = 'WHERE admin_id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

export const getAuditLogsByTable = async (table_name, tenantId) => {
  const params = [table_name];
  let where = 'WHERE table_name = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
};

export const createAuditLog = async (data) => {
  const { admin_id, action, table_name, record_id, description, tenant_id } = data;
  const result = await pool.query(
    `INSERT INTO audit_logs (admin_id, action, table_name, record_id, description, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [admin_id ?? null, action, table_name, record_id ?? null, description ?? null, tenant_id ?? null]
  );
  return result.rows[0];
};
