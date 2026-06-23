import pool from "../../db/config.js";

export const getStats = async (tenantId) => {
  const p = tenantId != null ? [tenantId] : [];
  const tf = tenantId != null ? 'WHERE s.tenant_id = $1' : '';
  const tf2 = tenantId != null ? 'AND s.tenant_id = $1' : '';
  const cf = tenantId != null ? 'WHERE tenant_id = $1' : '';

  const [metricsRes, pendingSalesRes, lowStockRes, recentPaidRes, trendRes] = await Promise.all([
    pool.query(`
      SELECT
        COALESCE(SUM(s.total), 0)::numeric                                AS total_ventas,
        COALESCE(SUM(COALESCE(paid.total_paid, 0)), 0)::numeric           AS total_cobrado,
        COALESCE(SUM(s.total - COALESCE(paid.total_paid, 0)), 0)::numeric AS saldo_pendiente,
        COUNT(*) FILTER (WHERE s.status != 'paid')                        AS ventas_pendientes,
        (SELECT COUNT(*) FROM customers ${cf})::bigint                     AS total_clientes,
        (SELECT COUNT(*) FROM products ${cf})::bigint                      AS total_productos,
        (SELECT COALESCE(SUM(cost * quantity), 0) FROM shopping ${cf})::numeric AS total_compras
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(amount) AS total_paid
        FROM payments GROUP BY sale_id
      ) paid ON s.id = paid.sale_id
      ${tf}
    `, p),

    pool.query(`
      SELECT
        s.id, c.name AS customer_name, s.currency,
        s.total,
        COALESCE(SUM(p.amount), 0)           AS total_paid,
        s.total - COALESCE(SUM(p.amount), 0) AS balance
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN payments  p ON s.id = p.sale_id
      WHERE s.status != 'paid' ${tf2}
      GROUP BY s.id, c.name, s.total, s.created_at
      ORDER BY s.created_at DESC
      LIMIT 8
    `, p),

    pool.query(`
      SELECT id, name, stock FROM products
      WHERE stock <= 5 ${tf2 ? tf2.replace('s.tenant_id', 'tenant_id') : ''}
      ORDER BY stock ASC, name ASC
    `, p),

    pool.query(`
      SELECT
        s.id, c.name AS customer_name,
        s.total,
        COALESCE(SUM(p.amount), 0)::numeric AS total_paid,
        MAX(p.payment_date)                 AS last_payment_date
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN payments  p ON s.id = p.sale_id
      WHERE s.status = 'paid' ${tf2}
      GROUP BY s.id, c.name, s.total, s.created_at
      ORDER BY MAX(p.payment_date) DESC NULLS LAST, s.created_at DESC
      LIMIT 8
    `, p),

    pool.query(`
      SELECT
        COALESCE(SUM(GREATEST(s.total - COALESCE(prev_paid.total_paid, 0), 0)), 0)::numeric AS saldo_mes_anterior
      FROM sales s
      LEFT JOIN (
        SELECT sale_id, SUM(amount) AS total_paid
        FROM payments
        WHERE payment_date < DATE_TRUNC('month', NOW())
        GROUP BY sale_id
      ) prev_paid ON s.id = prev_paid.sale_id
      WHERE COALESCE(s.sale_date, s.created_at::date) < DATE_TRUNC('month', NOW()) ${tf2}
    `, p),
  ]);

  return {
    ...metricsRes.rows[0],
    saldo_mes_anterior:  trendRes.rows[0].saldo_mes_anterior,
    pending_sales:       pendingSalesRes.rows,
    recently_paid_sales: recentPaidRes.rows,
    low_stock_products:  lowStockRes.rows,
  };
};

export const getMonthlyStats = async (tenantId) => {
  const params = [];
  let tenantFilter = '';
  if (tenantId != null) {
    tenantFilter = 'AND s.tenant_id = $1';
    params.push(tenantId);
  }

  const result = await pool.query(`
    SELECT
      DATE_TRUNC('month', s.sale_date)               AS month,
      COALESCE(SUM(s.total), 0)::numeric             AS total_ventas,
      COALESCE(SUM(COALESCE(paid.total_paid, 0)), 0)::numeric AS total_cobrado,
      COUNT(s.id)                                    AS num_ventas
    FROM sales s
    LEFT JOIN (
      SELECT sale_id, SUM(amount) AS total_paid
      FROM payments GROUP BY sale_id
    ) paid ON s.id = paid.sale_id
    WHERE s.sale_date >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months' ${tenantFilter}
    GROUP BY DATE_TRUNC('month', s.sale_date)
    ORDER BY month ASC
  `, params);
  return result.rows;
};
