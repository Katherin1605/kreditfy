import pool from "../../db/config.js";

export const getAllCustomers = async ({ search = '', page = 1, limit = 20 } = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let where = '';
  let idx = 1;

  if (search) {
    where = `WHERE name ILIKE $${idx} OR identity_card ILIKE $${idx}`;
    params.push(`%${search}%`);
    idx++;
  }

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM customers ${where}`, params),
    pool.query(
      `SELECT * FROM customers ${where} ORDER BY LOWER(name) LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    ),
  ]);

  const total = parseInt(countRes.rows[0].count);
  return {
    data:       dataRes.rows,
    total,
    page:       parseInt(page),
    limit:      parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

export const getCustomerById = async (id) => {
  const result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
  return result.rows[0];
};

export const createCustomer = async (customer) => {
  const { identity_card, name, phone, address } = customer;
  const result = await pool.query(
    `INSERT INTO customers (identity_card, name, phone, address)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [identity_card, name, phone, address]
  );
  return result.rows[0];
};

export const updateCustomer = async (id, customer) => {
  const { identity_card, name, phone, address } = customer;
  const result = await pool.query(
    `UPDATE customers
     SET identity_card = $1, name = $2, phone = $3, address = $4
     WHERE id = $5 RETURNING *`,
    [identity_card, name, phone, address, id]
  );
  return result.rows[0];
};

export const deleteCustomer = async (id) => {
  await pool.query("DELETE FROM customers WHERE id = $1", [id]);
};

export const importCustomers = async (customers) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    let skipped  = 0;
    for (const c of customers) {
      const res = await client.query(
        `INSERT INTO customers (name, identity_card, phone, address)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (identity_card) DO NOTHING`,
        [c.name.trim(), c.identity_card.trim(), c.phone || null, c.address || null]
      );
      if (res.rowCount > 0) inserted++;
      else skipped++;
    }
    await client.query('COMMIT');
    return { inserted, skipped };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
