import pool from "../../db/config.js";

pool.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL`)
  .catch(err => console.error('[admins] Error en migración logo_url:', err));

// Auto-crea la tabla si no existe al iniciar el servidor
pool.query(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token      VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => console.error('Error creando tabla password_reset_tokens:', err));

export const findAdminByEmail = async (email) => {
  const result = await pool.query(
    `SELECT a.*, t.name AS tenant_name, t.logo_url AS tenant_logo, t.plan AS tenant_plan,
            t.pending_review AS tenant_pending_review, pc.modules AS plan_modules
     FROM admins a
     LEFT JOIN tenants t ON t.id = a.tenant_id
     LEFT JOIN plan_configs pc ON pc.plan = t.plan
     WHERE a.email = $1`,
    [email]
  );
  return result.rows[0];
};

export const createResetToken = async (adminId, token) => {
  await pool.query(
    `INSERT INTO password_reset_tokens (admin_id, token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [adminId, token]
  );
};

export const findValidResetToken = async (token) => {
  const result = await pool.query(
    `SELECT prt.*, a.email FROM password_reset_tokens prt
     JOIN admins a ON a.id = prt.admin_id
     WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
    [token]
  );
  return result.rows[0];
};

export const markTokenUsed = async (token) => {
  await pool.query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE token = $1`,
    [token]
  );
};

export const updateAdminPassword = async (adminId, hashedPassword) => {
  await pool.query(
    `UPDATE admins SET password = $1 WHERE id = $2`,
    [hashedPassword, adminId]
  );
};

export const findAdminById = async (id) => {
  const result = await pool.query(
    `SELECT a.*, t.name AS tenant_name, t.logo_url AS tenant_logo, t.plan AS tenant_plan,
            pc.modules AS plan_modules
     FROM admins a
     LEFT JOIN tenants t ON t.id = a.tenant_id
     LEFT JOIN plan_configs pc ON pc.plan = t.plan
     WHERE a.id = $1 AND a.active = TRUE`,
    [id]
  );
  return result.rows[0];
};
