import pool from "../../db/config.js";

pool.query(`
  ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS currency      VARCHAR(3)    NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4) DEFAULT NULL
`).catch(err => console.error('[payments] Error en migración:', err));

export const getAllPayments = async (tenantId) => {
  const params = [];
  let where = '';
  if (tenantId != null) { where = 'WHERE tenant_id = $1'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM payments ${where} ORDER BY id`, params);
  return result.rows;
};

export const getPaymentById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM payments ${where}`, params);
  return result.rows[0];
};

export const getPaymentsBySaleId = async (sale_id, tenantId) => {
  const params = [sale_id];
  let where = 'WHERE sale_id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(
    `SELECT * FROM payments ${where} ORDER BY payment_date ASC, id ASC`,
    params
  );
  return result.rows;
};

export const createPayment = async (data, tenantId) => {
  const { sale_id, amount, method, payment_date, exchange_rate = null } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const saleParams = [sale_id];
    let saleWhere = 'WHERE id = $1';
    if (tenantId != null) { saleWhere += ' AND tenant_id = $2'; saleParams.push(tenantId); }
    const saleResult = await client.query(
      `SELECT total, currency FROM sales ${saleWhere}`,
      saleParams
    );
    const sale = saleResult.rows[0];
    const currency = sale?.currency || 'USD';

    const paymentResult = await client.query(
      `INSERT INTO payments (sale_id, amount, method, payment_date, currency, exchange_rate, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [sale_id, amount, method ?? null, payment_date || new Date().toISOString().split('T')[0], currency, exchange_rate, tenantId]
    );
    const payment = paymentResult.rows[0];

    const sumResult = await client.query(
      'SELECT SUM(amount) AS total_pagado FROM payments WHERE sale_id = $1',
      [sale_id]
    );
    const totalPagado = parseFloat(sumResult.rows[0].total_pagado);

    if (sale && totalPagado >= parseFloat(sale.total)) {
      await client.query("UPDATE sales SET status = 'paid' WHERE id = $1", [sale_id]);
    }

    await client.query('COMMIT');
    return payment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updatePayment = async (id, data, tenantId) => {
  const { amount, method, payment_date, exchange_rate } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const params = [id];
    let where = 'WHERE id = $1';
    if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
    const result = await client.query(
      `UPDATE payments
         SET amount = $${params.length + 1},
             method = $${params.length + 2},
             payment_date = $${params.length + 3},
             exchange_rate = $${params.length + 4}
       ${where}
       RETURNING *`,
      [...params, amount, method ?? null, payment_date, exchange_rate ?? null]
    );
    const payment = result.rows[0];
    if (!payment) { await client.query('ROLLBACK'); return null; }

    const sumResult = await client.query(
      'SELECT SUM(amount) AS total_pagado FROM payments WHERE sale_id = $1',
      [payment.sale_id]
    );
    const totalPagado = parseFloat(sumResult.rows[0].total_pagado);
    const saleResult = await client.query('SELECT total FROM sales WHERE id = $1', [payment.sale_id]);
    const saleTotal  = parseFloat(saleResult.rows[0]?.total || 0);
    const newStatus  = totalPagado >= saleTotal ? 'paid' : 'pending';
    await client.query('UPDATE sales SET status = $1 WHERE id = $2', [newStatus, payment.sale_id]);

    await client.query('COMMIT');
    return payment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deletePayment = async (id, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const params = [id];
    let where = 'WHERE id = $1';
    if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
    const deleted = await client.query(`DELETE FROM payments ${where} RETURNING sale_id`, params);
    const sale_id = deleted.rows[0]?.sale_id;

    if (sale_id) {
      const sumResult = await client.query(
        'SELECT SUM(amount) AS total_pagado FROM payments WHERE sale_id = $1',
        [sale_id]
      );
      const totalPagado = parseFloat(sumResult.rows[0].total_pagado || 0);
      const saleResult = await client.query('SELECT total FROM sales WHERE id = $1', [sale_id]);
      const saleTotal  = parseFloat(saleResult.rows[0]?.total || 0);
      const newStatus  = totalPagado >= saleTotal ? 'paid' : 'pending';
      await client.query('UPDATE sales SET status = $1 WHERE id = $2', [newStatus, sale_id]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
