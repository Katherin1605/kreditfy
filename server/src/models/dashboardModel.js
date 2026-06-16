import pool from "../../db/config.js";

export const getStats = async (currency = '') => {
  const params = currency ? [currency] : [];
  const cFilter = currency ? 'WHERE s.currency = $1' : '';
  const cAnd    = currency ? 'AND s.currency = $1'   : '';

  const [metricsRes, pendingSalesRes, lowStockRes] = await Promise.all([
    pool.query(`
      SELECT
        COALESCE(SUM(s.total), 0)::numeric                                AS total_ventas,
        COALESCE(SUM(COALESCE(paid.total_paid, 0)), 0)::numeric           AS total_cobrado,
        COALESCE(SUM(s.total - COALESCE(paid.total_paid, 0)), 0)::numeric AS saldo_pendiente,
        COUNT(*) FILTER (WHERE s.status != 'paid')                        AS ventas_pendientes,
        (SELECT COUNT(*) FROM customers)                                   AS total_clientes,
        (SELECT COUNT(*) FROM products)                                    AS total_productos
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(amount) AS total_paid
        FROM payments GROUP BY sale_id
      ) paid ON s.id = paid.sale_id
      ${cFilter}
    `, params),
    pool.query(`
      SELECT
        s.id, c.name AS customer_name, s.currency,
        s.total,
        COALESCE(SUM(p.amount), 0)           AS total_paid,
        s.total - COALESCE(SUM(p.amount), 0) AS balance
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN payments  p ON s.id = p.sale_id
      WHERE s.status != 'paid' ${cAnd}
      GROUP BY s.id, c.name, s.total, s.created_at
      ORDER BY s.created_at DESC
      LIMIT 8
    `, params),
    pool.query(`
      SELECT id, name, stock
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC, name ASC
    `),
  ]);

  return {
    ...metricsRes.rows[0],
    pending_sales:      pendingSalesRes.rows,
    low_stock_products: lowStockRes.rows,
  };
};

export const getMonthlyStats = async (currency = '') => {
  const params = currency ? [currency] : [];
  const cFilter = currency ? 'AND s.currency = $1' : '';

  const result = await pool.query(`
    SELECT
      DATE_TRUNC('month', s.sale_date)             AS month,
      COALESCE(SUM(s.total), 0)::numeric           AS total_ventas,
      COALESCE(SUM(COALESCE(paid.total_paid, 0)), 0)::numeric AS total_cobrado,
      COUNT(s.id)                                  AS num_ventas
    FROM sales s
    LEFT JOIN (
      SELECT sale_id, SUM(amount) AS total_paid
      FROM payments GROUP BY sale_id
    ) paid ON s.id = paid.sale_id
    WHERE s.sale_date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    ${cFilter}
    GROUP BY DATE_TRUNC('month', s.sale_date)
    ORDER BY month ASC
  `, params);
  return result.rows;
};
