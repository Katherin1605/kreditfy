import pool from "../../db/config.js";

export const findAdminByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM admins WHERE email = $1 AND active = TRUE",
    [email]
  );
  return result.rows[0];
};
