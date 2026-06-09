import pool from "../../db/config.js";

export const getAllProducts = async () => {
  const result = await pool.query("SELECT * FROM products ORDER BY id");
  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  return result.rows[0];
};

export const createProduct = async (product) => {
  const { name, description, price, stock } = product;
  const result = await pool.query(
    `INSERT INTO products (name, description, price, stock)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, description, price, stock ?? 0]
  );
  return result.rows[0];
};

export const updateProduct = async (id, product) => {
  const { name, description, price, stock } = product;
  const result = await pool.query(
    `UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING *`,
    [name, description, price, stock, id]
  );
  return result.rows[0];
};

export const deleteProduct = async (id) => {
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
};
