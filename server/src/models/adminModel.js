import pool from "../../db/config.js";
import bcrypt from "bcryptjs";

pool.query(`
  UPDATE admins
  SET permissions = array_append(permissions, 'earnings')
  WHERE NOT ('earnings' = ANY(permissions))
`).catch(err => console.error('[admins] Error en migración de permisos:', err));

export const getAllAdmins = async (tenantId) => {
  const params = [];
  let where = '';
  if (tenantId != null) { where = 'WHERE tenant_id = $1'; params.push(tenantId); }
  const result = await pool.query(
    `SELECT id, name, email, role, active, permissions, tenant_id, created_at FROM admins ${where} ORDER BY id`,
    params
  );
  return result.rows;
};

export const getAdminById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(
    `SELECT id, name, email, role, active, permissions, tenant_id, created_at FROM admins ${where}`,
    params
  );
  return result.rows[0];
};

export const createAdmin = async (data, tenantId) => {
  const { name, email, password, role } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO admins (name, email, password, role, tenant_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, active, permissions, tenant_id, created_at`,
    [name, email, hashedPassword, role || 'admin', tenantId ?? null]
  );
  return result.rows[0];
};

export const updateAdmin = async (id, data, tenantId) => {
  const { name, email, role, password } = data;
  const params = password
    ? [name, email, role, await bcrypt.hash(password, 10), id]
    : [name, email, role, id];
  const idIdx = password ? 5 : 4;
  let where = `WHERE id = $${idIdx}`;
  if (tenantId != null) { where += ` AND tenant_id = $${idIdx + 1}`; params.push(tenantId); }

  const setClause = password
    ? 'SET name = $1, email = $2, role = $3, password = $4'
    : 'SET name = $1, email = $2, role = $3';

  const result = await pool.query(
    `UPDATE admins ${setClause} ${where}
     RETURNING id, name, email, role, active, permissions, tenant_id, created_at`,
    params
  );
  return result.rows[0];
};

export const deleteAdmin = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  await pool.query(`DELETE FROM admins ${where}`, params);
};

export const updateAdminActive = async (id, active, tenantId) => {
  const params = [active, id];
  let where = 'WHERE id = $2';
  if (tenantId != null) { where += ' AND tenant_id = $3'; params.push(tenantId); }
  const result = await pool.query(
    `UPDATE admins SET active = $1 ${where}
     RETURNING id, name, email, role, active, permissions, tenant_id, created_at`,
    params
  );
  return result.rows[0];
};

export const updateAdminPermissions = async (id, permissions, tenantId) => {
  const params = [permissions, id];
  let where = 'WHERE id = $2';
  if (tenantId != null) { where += ' AND tenant_id = $3'; params.push(tenantId); }
  const result = await pool.query(
    `UPDATE admins SET permissions = $1 ${where}
     RETURNING id, name, email, role, active, permissions, tenant_id, created_at`,
    params
  );
  return result.rows[0];
};
