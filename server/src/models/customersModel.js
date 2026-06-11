import pool from "../../db/config.js";

// Obtener todos los clientes, con búsqueda opcional por nombre o cédula
export const getAllCustomers = async (search = '') => {
  if (search) {
    const result = await pool.query(
      `SELECT * FROM customers
       WHERE name ILIKE $1 OR identity_card ILIKE $1
       ORDER BY name`,
      [`%${search}%`]
    );
    return result.rows;
  }
  const result = await pool.query("SELECT * FROM customers ORDER BY name");
  return result.rows;
};

// Crear cliente
export const createCustomer = async (customer) => {
  const { identity_card, name, phone, address } = customer;

  const result = await pool.query(
    `INSERT INTO customers (identity_card, name, phone, address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [identity_card, name, phone, address]
  );

  return result.rows[0];
};

// Obtener cliente por ID
export const getCustomerById = async (id) => {
  const result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
  return result.rows[0];
};

// Actualizar cliente
export const updateCustomer = async (id, customer) => {
  const { identity_card, name, phone, address } = customer;

  const result = await pool.query(
    `UPDATE customers
     SET identity_card = $1, name = $2, phone = $3, address = $4
     WHERE id = $5
     RETURNING *`,
    [identity_card, name, phone, address, id]
  );

  return result.rows[0];
};

// Eliminar cliente
export const deleteCustomer = async (id) => {
  await pool.query("DELETE FROM customers WHERE id = $1", [id]);
};