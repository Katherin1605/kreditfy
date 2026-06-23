import pool from "../../db/config.js";

export const findAdminByEmail = async (email) => {
  const result = await pool.query(
    `SELECT a.*, t.name AS tenant_name
     FROM admins a
     LEFT JOIN tenants t ON t.id = a.tenant_id
     WHERE a.email = $1 AND a.active = TRUE`,
    [email]
  );
  return result.rows[0];
};

export const findAdminById = async (id) => {
  const result = await pool.query(
    `SELECT a.*, t.name AS tenant_name
     FROM admins a
     LEFT JOIN tenants t ON t.id = a.tenant_id
     WHERE a.id = $1 AND a.active = TRUE`,
    [id]
  );
  return result.rows[0];
};
