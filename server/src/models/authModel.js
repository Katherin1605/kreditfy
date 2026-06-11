import pool from "../../db/config.js";

export const findAdminByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM admins WHERE email = $1 AND active = TRUE",
    [email]
  );
  return result.rows[0];
};

export const findAdminById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM admins WHERE id = $1 AND active = TRUE",
    [id]
  );
  return result.rows[0];
};
