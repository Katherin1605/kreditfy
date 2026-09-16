import pool from "../../db/config.js";

export const getAllCustomers = async ({ search = '', page = 1, limit = 20, tenantId } = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];
  let idx = 1;

  if (tenantId != null) {
    conditions.push(`tenant_id = $${idx++}`);
    params.push(tenantId);
  }
  if (search) {
    conditions.push(`(name ILIKE $${idx} OR identity_card ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

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

export const getCustomerById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM customers ${where}`, params);
  return result.rows[0];
};

export const createCustomer = async (customer, tenantId) => {
  const { identity_card, name, phone, address } = customer;
  const result = await pool.query(
    `INSERT INTO customers (identity_card, name, phone, address, tenant_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [identity_card, name, phone, address, tenantId]
  );
  return result.rows[0];
};

export const updateCustomer = async (id, customer, tenantId) => {
  const { identity_card, name, phone, address } = customer;
  const params = [identity_card, name, phone, address, id];
  let where = 'WHERE id = $5';
  if (tenantId != null) { where += ' AND tenant_id = $6'; params.push(tenantId); }
  const result = await pool.query(
    `UPDATE customers SET identity_card = $1, name = $2, phone = $3, address = $4 ${where} RETURNING *`,
    params
  );
  return result.rows[0];
};

export const getCustomerPendingSalesCount = async (id, tenantId) => {
  const params = [id];
  let where = "WHERE customer_id = $1 AND status != 'paid'";
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT COUNT(*) FROM sales ${where}`, params);
  return parseInt(result.rows[0].count);
};

export const deleteCustomer = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  await pool.query(`DELETE FROM customers ${where}`, params);
};

export const importCustomers = async (customers, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    let updated  = 0;
    let skipped  = 0;
    for (const c of customers) {
      const res = await client.query(
        `INSERT INTO customers (name, identity_card, phone, address, tenant_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (identity_card) DO UPDATE SET
           name    = EXCLUDED.name,
           phone   = COALESCE(NULLIF(EXCLUDED.phone::text,   ''), customers.phone),
           address = COALESCE(NULLIF(EXCLUDED.address::text, ''), customers.address)
         WHERE customers.tenant_id = EXCLUDED.tenant_id
         RETURNING xmax`,
        [c.name.trim(), c.identity_card.trim(), c.phone || null, c.address || null, tenantId]
      );
      if (res.rowCount === 0) skipped++;
      else if (res.rows[0]?.xmax === '0' || res.rows[0]?.xmax === 0) inserted++;
      else updated++;
    }
    await client.query('COMMIT');
    return { inserted, updated, skipped };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
