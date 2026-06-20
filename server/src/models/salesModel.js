import pool from "../../db/config.js";

pool.query(`
  ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS sale_date     DATE           NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS currency      VARCHAR(3)     NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4)  DEFAULT NULL
`).catch(err => console.error('[sales] Error en migración:', err));

export const getAllSales = async ({ page = 1, limit = 15, q = '' } = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let where = '';
  let idx = 1;

  if (q) {
    where = `WHERE (c.name ILIKE $${idx} OR CAST(s.id AS TEXT) LIKE $${idx})`;
    params.push(`%${q}%`);
    idx++;
  }

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

export const getSaleById = async (id) => {
  const saleResult = await pool.query(
    `SELECT
       s.id,
       s.customer_id,
       c.name AS customer_name,
       s.total,
       s.cuotas,
       ROUND(s.total / NULLIF(s.cuotas, 0), 2) AS valor_cuota,
       s.status,
       s.sale_date,
       s.created_at,
       COALESCE(SUM(p.amount), 0) AS total_paid,
       s.total - COALESCE(SUM(p.amount), 0) AS balance
     FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     LEFT JOIN payments p ON s.id = p.sale_id
     WHERE s.id = $1
     GROUP BY s.id, c.name`,
    [id]
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

export const createSaleWithDetails = async (saleData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { customer_id, products, cuotas = 1, sale_date, currency = 'USD', exchange_rate = null } = saleData;

    const total = products.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0
    );

    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, total, cuotas, sale_date, currency, exchange_rate)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customer_id, total, cuotas, sale_date || new Date().toISOString().split('T')[0], currency, exchange_rate]
    );

    const sale = saleResult.rows[0];

    // 📄 Insertar detalles
    for (const product of products) {
      await client.query(
        `INSERT INTO sale_details (sale_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [sale.id, product.product_id, product.quantity, product.price]
      );
    }

    await client.query("COMMIT");

    return sale;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteSaleById = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const details = await client.query(
      "SELECT * FROM sale_details WHERE sale_id = $1",
      [id]
    );

    for (const detail of details.rows) {
      await client.query(
        "UPDATE products SET stock = stock + $1 WHERE id = $2",
        [detail.quantity, detail.product_id]
      );
    }

    await client.query("DELETE FROM sales WHERE id = $1", [id]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateSaleById = async (id, saleData) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { customer_id, products, cuotas = 1, sale_date, currency = 'USD', exchange_rate = null } = saleData;

    // Restaurar stock de los detalles actuales
    const currentDetails = await client.query(
      "SELECT * FROM sale_details WHERE sale_id = $1",
      [id]
    );

    for (const detail of currentDetails.rows) {
      await client.query(
        "UPDATE products SET stock = stock + $1 WHERE id = $2",
        [detail.quantity, detail.product_id]
      );
    }

    // Eliminar detalles actuales
    await client.query("DELETE FROM sale_details WHERE sale_id = $1", [id]);

    // Recalcular total
    const total = products.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0
    );

    const saleResult = await client.query(
      `UPDATE sales SET customer_id = $1, total = $2, cuotas = $3, sale_date = $4, currency = $5, exchange_rate = $6 WHERE id = $7 RETURNING *`,
      [customer_id, total, cuotas, sale_date || new Date().toISOString().split('T')[0], currency, exchange_rate, id]
    );

    const sale = saleResult.rows[0];

    // Insertar nuevos detalles (el trigger trigger_decrease_stock ajusta el stock)
    for (const product of products) {
      await client.query(
        `INSERT INTO sale_details (sale_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [sale.id, product.product_id, product.quantity, product.price]
      );
    }

    await client.query("COMMIT");

    return sale;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};