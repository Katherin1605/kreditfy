import pool from "../../db/config.js";

export const getAllTenants = async () => {
  const result = await pool.query('SELECT * FROM tenants ORDER BY id');
  return result.rows;
};

export const getTenantById = async (id) => {
  const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
  return result.rows[0];
};

export const createTenant = async ({ name, slug, currency = 'USD', logo_url = null }) => {
  const result = await pool.query(
    `INSERT INTO tenants (name, slug, currency, logo_url) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, slug, currency, logo_url]
  );
  return result.rows[0];
};

export const updateTenant = async (id, { name, slug, currency, logo_url, active }) => {
  const result = await pool.query(
    `UPDATE tenants SET name = $1, slug = $2, currency = $3, logo_url = $4, active = $5
     WHERE id = $6 RETURNING *`,
    [name, slug, currency, logo_url, active, id]
  );
  return result.rows[0];
};

export const getAdminsByTenant = async (tenantId) => {
  const result = await pool.query(
    `SELECT id, name, email, role, active, permissions, created_at
     FROM admins WHERE tenant_id = $1 ORDER BY id`,
    [tenantId]
  );
  return result.rows;
};

export const toggleAdminActive = async (adminId, tenantId) => {
  const result = await pool.query(
    `UPDATE admins SET active = NOT active WHERE id = $1 AND tenant_id = $2 RETURNING id, active`,
    [adminId, tenantId]
  );
  return result.rows[0];
};

export const getPlatformStats = async () => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM tenants WHERE active = TRUE)::int   AS active_tenants,
      (SELECT COUNT(*) FROM tenants)::int                        AS total_tenants,
      (SELECT COUNT(*) FROM sales)::int                          AS total_sales,
      (SELECT COUNT(*) FROM customers)::int                      AS total_customers,
      (SELECT COALESCE(SUM(total), 0) FROM sales)::numeric       AS total_revenue
  `);
  return result.rows[0];
};
