import pool from "../../db/config.js";

export const getAllShopping = async () => {
  const result = await pool.query("SELECT * FROM shopping ORDER BY id");
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
  const { product_id, quantity, cost } = data;
  const result = await pool.query(
    `INSERT INTO shopping (product_id, quantity, cost) VALUES ($1, $2, $3) RETURNING *`,
    [product_id, quantity, cost]
  );
  return result.rows[0];
};

export const deleteShopping = async (id) => {
  await pool.query("DELETE FROM shopping WHERE id = $1", [id]);
};
