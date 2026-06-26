import pool from "../../db/config.js";

const initPlans = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plan_configs (
      plan        VARCHAR(20) PRIMARY KEY,
      max_admins  INTEGER     NOT NULL DEFAULT -1,
      modules     TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    INSERT INTO plan_configs (plan, max_admins, modules) VALUES
      ('basic', 2, ARRAY['customers','products','sales','payments']::TEXT[]),
      ('pro',  -1, ARRAY['customers','products','shopping','sales','payments','earnings','audit']::TEXT[])
    ON CONFLICT (plan) DO NOTHING
  `);
  await pool.query(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'basic'`);
};
initPlans().catch(err => console.error('Error inicializando plan_configs:', err));

export const getPlanConfigs = async () => {
  const result = await pool.query('SELECT * FROM plan_configs ORDER BY plan');
  return result.rows;
};

export const updatePlanConfig = async (plan, { max_admins, modules }) => {
  const result = await pool.query(
    `UPDATE plan_configs SET max_admins = $1, modules = $2, updated_at = NOW()
     WHERE plan = $3 RETURNING *`,
    [max_admins, modules, plan]
  );
  return result.rows[0];
};

export const getAdminCount = async (tenantId) => {
  const result = await pool.query(
    'SELECT COUNT(*)::int AS count FROM admins WHERE tenant_id = $1',
    [tenantId]
  );
  return result.rows[0].count;
};

export const getTenantWithPlan = async (tenantId) => {
  const result = await pool.query(
    `SELECT t.*, pc.max_admins AS plan_max_admins
     FROM tenants t
     LEFT JOIN plan_configs pc ON pc.plan = t.plan
     WHERE t.id = $1`,
    [tenantId]
  );
  return result.rows[0];
};

export const getAllTenants = async () => {
  const result = await pool.query('SELECT * FROM tenants ORDER BY id');
  return result.rows;
};

export const getTenantById = async (id) => {
  const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
  return result.rows[0];
};

export const createTenant = async ({ name, slug, currency = 'USD', logo_url = null, plan = 'basic' }) => {
  const result = await pool.query(
    `INSERT INTO tenants (name, slug, currency, logo_url, plan) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, slug, currency, logo_url, plan]
  );
  return result.rows[0];
};

export const updateTenant = async (id, { name, slug, currency, logo_url, active, plan }) => {
  const result = await pool.query(
    `UPDATE tenants SET name = $1, slug = $2, currency = $3, logo_url = $4, active = $5, plan = $6
     WHERE id = $7 RETURNING *`,
    [name, slug, currency, logo_url, active, plan ?? 'basic', id]
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
