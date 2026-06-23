import pool from "../../db/config.js";

pool.query(`
  ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS sale_date     DATE           NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS currency      VARCHAR(3)     NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4)  DEFAULT NULL
`).catch(err => console.error('[sales] Error en migración:', err));

export const getAllSales = async ({ page = 1, limit = 15, q = '', date_from = '', date_to = '', status = '', tenantId } = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];
  let idx = 1;

  if (tenantId != null) {
    conditions.push(`s.tenant_id = $${idx++}`);
    params.push(tenantId);
  }
  if (q) {
    conditions.push(`(c.name ILIKE $${idx} OR CAST(s.id AS TEXT) LIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }
  if (date_from) {
    conditions.push(`s.sale_date >= $${idx++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`s.sale_date <= $${idx++}`);
    params.push(date_to);
  }
  if (status) {
    conditions.push(`s.status = $${idx++}`);
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, dataRes] = await Promise.all([
    pool.query(
      `SELECT COUNT(DISTINCT s.id)
       FROM sales s LEFT JOIN customers c ON s.customer_id = c.id ${where}`,
      params
    ),
    pool.query(
      `SELECT
         s.id, s.customer_id, c.name AS customer_name,
         s.total, s.cuotas,
         ROUND(s.total / NULLIF(s.cuotas, 0), 2) AS valor_cuota,
         s.status, s.currency, s.exchange_rate, s.sale_date, s.created_at,
         COALESCE(SUM(p.amount), 0) AS total_paid,
         s.total - COALESCE(SUM(p.amount), 0) AS balance,
         MAX(p.payment_date) AS last_payment_date
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN payments p ON s.id = p.sale_id
       ${where}
       GROUP BY s.id, c.name
       ORDER BY s.sale_date DESC, s.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
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

export const getSaleById = async (id, tenantId) => {
  const params = [id];
  let tenantFilter = '';
  if (tenantId != null) { tenantFilter = ' AND s.tenant_id = $2'; params.push(tenantId); }

  const saleResult = await pool.query(
    `SELECT
       s.id, s.customer_id, c.name AS customer_name,
       s.total, s.cuotas,
       ROUND(s.total / NULLIF(s.cuotas, 0), 2) AS valor_cuota,
       s.status, s.sale_date, s.created_at,
       COALESCE(SUM(p.amount), 0) AS total_paid,
       s.total - COALESCE(SUM(p.amount), 0) AS balance
     FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     LEFT JOIN payments p ON s.id = p.sale_id
     WHERE s.id = $1${tenantFilter}
     GROUP BY s.id, c.name`,
    params
  );

  const sale = saleResult.rows[0];
  if (!sale) return null;

  const detailsResult = await pool.query(
    `SELECT sd.*, pr.name AS product_name
     FROM sale_details sd
     JOIN products pr ON sd.product_id = pr.id
     WHERE sd.sale_id = $1`,
    [id]
  );

  return { ...sale, details: detailsResult.rows };
};

export const createSaleWithDetails = async (saleData, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, products, cuotas = 1, sale_date, currency = 'USD', exchange_rate = null } = saleData;

    const total = products.reduce((sum, p) => sum + p.quantity * p.price, 0);

    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, total, cuotas, sale_date, currency, exchange_rate, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customer_id, total, cuotas, sale_date || new Date().toISOString().split('T')[0], currency, exchange_rate, tenantId]
    );
    const sale = saleResult.rows[0];

    for (const product of products) {
      await client.query(
        `INSERT INTO sale_details (sale_id, product_id, quantity, price, tenant_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, product.product_id, product.quantity, product.price, tenantId]
      );
    }

    await client.query('COMMIT');
    return sale;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteSaleById = async (id, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const details = await client.query('SELECT * FROM sale_details WHERE sale_id = $1', [id]);

    for (const detail of details.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [detail.quantity, detail.product_id]
      );
    }

    const params = [id];
    let where = 'WHERE id = $1';
    if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
    await client.query(`DELETE FROM sales ${where}`, params);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateSaleById = async (id, saleData, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_id, products, cuotas = 1, sale_date, currency = 'USD', exchange_rate = null } = saleData;

    const currentDetails = await client.query('SELECT * FROM sale_details WHERE sale_id = $1', [id]);
    for (const detail of currentDetails.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [detail.quantity, detail.product_id]
      );
    }

    await client.query('DELETE FROM sale_details WHERE sale_id = $1', [id]);

    const total = products.reduce((sum, p) => sum + p.quantity * p.price, 0);

    const updateParams = [customer_id, total, cuotas, sale_date || new Date().toISOString().split('T')[0], currency, exchange_rate, id];
    let updateWhere = 'WHERE id = $7';
    if (tenantId != null) { updateWhere += ' AND tenant_id = $8'; updateParams.push(tenantId); }

    const saleResult = await client.query(
      `UPDATE sales SET customer_id = $1, total = $2, cuotas = $3, sale_date = $4, currency = $5, exchange_rate = $6 ${updateWhere} RETURNING *`,
      updateParams
    );
    const sale = saleResult.rows[0];

    for (const product of products) {
      await client.query(
        `INSERT INTO sale_details (sale_id, product_id, quantity, price, tenant_id) VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, product.product_id, product.quantity, product.price, tenantId]
      );
    }

    await client.query('COMMIT');
    return sale;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
