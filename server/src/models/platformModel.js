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

export const resetAdminPassword = async (adminId, tenantId, hashedPassword) => {
  const result = await pool.query(
    `UPDATE admins SET password = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id`,
    [hashedPassword, adminId, tenantId]
  );
  return result.rows[0];
};

export const updateTenantLogo = async (tenantId, logoUrl) => {
  const result = await pool.query(
    `UPDATE tenants SET logo_url = $1 WHERE id = $2 RETURNING *`,
    [logoUrl, tenantId]
  );
  return result.rows[0];
};

export const toggleAdminActive = async (adminId, tenantId) => {
  const result = await pool.query(
    `UPDATE admins SET active = NOT active WHERE id = $1 AND tenant_id = $2 RETURNING id, active`,
    [adminId, tenantId]
  );
  return result.rows[0];
};

export const getTenantsBreakdown = async () => {
  const result = await pool.query(`
    WITH payment_totals AS (
      SELECT s.tenant_id, COALESCE(SUM(p.amount), 0) AS total_paid
      FROM sales s
      LEFT JOIN payments p ON p.sale_id = s.id
      WHERE s.status = 'pending'
      GROUP BY s.tenant_id
    ),
    sale_totals AS (
      SELECT tenant_id,
        COUNT(*)::int                                                    AS total_sales,
        COALESCE(SUM(total), 0)::numeric                                 AS total_revenue,
        COUNT(*) FILTER (WHERE status = 'pending')::int                  AS pending_sales,
        COALESCE(SUM(total) FILTER (WHERE status = 'pending'), 0)::numeric AS pending_total
      FROM sales
      GROUP BY tenant_id
    ),
    customer_totals AS (
      SELECT tenant_id, COUNT(*)::int AS total_customers
      FROM customers
      GROUP BY tenant_id
    )
    SELECT
      t.id,
      t.name,
      t.slug,
      t.active,
      COALESCE(ct.total_customers, 0)                        AS total_customers,
      COALESCE(st.total_sales, 0)                            AS total_sales,
      COALESCE(st.total_revenue, 0)                          AS total_revenue,
      COALESCE(st.pending_sales, 0)                          AS pending_sales,
      GREATEST(COALESCE(st.pending_total, 0) - COALESCE(pt.total_paid, 0), 0) AS pending_balance
    FROM tenants t
    LEFT JOIN customer_totals ct ON ct.tenant_id = t.id
    LEFT JOIN sale_totals      st ON st.tenant_id = t.id
    LEFT JOIN payment_totals   pt ON pt.tenant_id = t.id
    ORDER BY t.id
  `);
  return result.rows;
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
