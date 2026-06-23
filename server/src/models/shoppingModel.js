import pool from "../../db/config.js";

pool.query(`
  ALTER TABLE shopping ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD'
`).catch(err => console.error('[shopping] Error en migración:', err));

export const getAllShopping = async (tenantId) => {
  const params = [];
  let where = '';
  if (tenantId != null) { where = 'WHERE tenant_id = $1'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM shopping ${where} ORDER BY date DESC, id DESC`, params);
  return result.rows;
};

export const getShoppingById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM shopping ${where}`, params);
  return result.rows[0];
};

export const getShoppingByProductId = async (product_id, tenantId) => {
  const params = [product_id];
  let where = 'WHERE product_id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM shopping ${where} ORDER BY id`, params);
  return result.rows;
};

export const createShopping = async (data, tenantId) => {
  const { product_id, quantity, cost, currency = 'USD', date } = data;
  const result = await pool.query(
    `INSERT INTO shopping (product_id, quantity, cost, currency, date, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [product_id, quantity, cost, currency, date || new Date().toISOString().split('T')[0], tenantId]
  );
  return result.rows[0];
};

export const deleteShopping = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  await pool.query(`DELETE FROM shopping ${where}`, params);
};
