import pool from "../../db/config.js";
import bcrypt from "bcryptjs";

export const getAllAdmins = async () => {
  const result = await pool.query(
    "SELECT id, name, email, role, active, permissions, created_at FROM admins ORDER BY id"
  );
  return result.rows;
};

export const getAdminById = async (id) => {
  const result = await pool.query(
    "SELECT id, name, email, role, active, permissions, created_at FROM admins WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createAdmin = async (data) => {
  const { name, email, password, role } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO admins (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, active, permissions, created_at`,
    [name, email, hashedPassword, role || "admin"]
  );
  return result.rows[0];
};

export const updateAdmin = async (id, data) => {
  const { name, email, role, password } = data;
  let result;
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    result = await pool.query(
      `UPDATE admins
       SET name = $1, email = $2, role = $3, password = $4
       WHERE id = $5
       RETURNING id, name, email, role, active, permissions, created_at`,
      [name, email, role, hashedPassword, id]
    );
  } else {
    result = await pool.query(
      `UPDATE admins
       SET name = $1, email = $2, role = $3
       WHERE id = $4
       RETURNING id, name, email, role, active, permissions, created_at`,
      [name, email, role, id]
    );
  }
  return result.rows[0];
};

export const deleteAdmin = async (id) => {
  await pool.query("DELETE FROM admins WHERE id = $1", [id]);
};

export const updateAdminActive = async (id, active) => {
  const result = await pool.query(
    `UPDATE admins SET active = $1 WHERE id = $2
     RETURNING id, name, email, role, active, permissions, created_at`,
    [active, id]
  );
  return result.rows[0];
};

export const updateAdminPermissions = async (id, permissions) => {
  const result = await pool.query(
    `UPDATE admins SET permissions = $1 WHERE id = $2
     RETURNING id, name, email, role, active, permissions, created_at`,
    [permissions, id]
  );
  return result.rows[0];
};
