import pool from "../../db/config.js";

export const getAllProducts = async (tenantId) => {
  const params = [];
  let where = '';
  if (tenantId != null) { where = 'WHERE tenant_id = $1'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM products ${where} ORDER BY id`, params);
  return result.rows;
};

export const getProductById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM products ${where}`, params);
  return result.rows[0];
};

export const createProduct = async (product, tenantId) => {
  const { name, description, price, stock } = product;
  const result = await pool.query(
    `INSERT INTO products (name, description, price, stock, tenant_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, description, price, stock ?? 0, tenantId]
  );
  return result.rows[0];
};

export const updateProduct = async (id, product, tenantId) => {
  const { name, description, price, stock } = product;
  const params = [name, description, price, stock, id];
  let where = 'WHERE id = $5';
  if (tenantId != null) { where += ' AND tenant_id = $6'; params.push(tenantId); }
  const result = await pool.query(
    `UPDATE products SET name = $1, description = $2, price = $3, stock = $4 ${where} RETURNING *`,
    params
  );
  return result.rows[0];
};

export const deleteProduct = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  await pool.query(`DELETE FROM products ${where}`, params);
};
