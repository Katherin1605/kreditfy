import pool from "../../db/config.js";

pool.query(`
  ALTER TABLE shopping ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD'
`).catch(err => console.error('[shopping] Error en migración:', err));

export const getAllShopping = async () => {
  const result = await pool.query("SELECT * FROM shopping ORDER BY date DESC, id DESC");
  return result.rows;
};

export const getShoppingById = async (id) => {
  const result = await pool.query("SELECT * FROM shopping WHERE id = $1", [id]);
  return result.rows[0];
};

export const getShoppingByProductId = async (product_id) => {
  const result = await pool.query(
    "SELECT * FROM shopping WHERE product_id = $1 ORDER BY id",
    [product_id]
  );
  return result.rows;
};

export const createShopping = async (data) => {
  const { product_id, quantity, cost, currency = 'USD' } = data;
  const result = await pool.query(
    `INSERT INTO shopping (product_id, quantity, cost, currency) VALUES ($1, $2, $3, $4) RETURNING *`,
    [product_id, quantity, cost, currency]
  );
  return result.rows[0];
};

export const deleteShopping = async (id) => {
  await pool.query("DELETE FROM shopping WHERE id = $1", [id]);
};
