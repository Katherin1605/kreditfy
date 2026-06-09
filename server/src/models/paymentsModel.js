import pool from "../../db/config.js";

export const getAllPayments = async () => {
  const result = await pool.query("SELECT * FROM payments ORDER BY id");
  return result.rows;
};

export const getPaymentById = async (id) => {
  const result = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
  return result.rows[0];
};

export const getPaymentsBySaleId = async (sale_id) => {
  const result = await pool.query(
    "SELECT * FROM payments WHERE sale_id = $1 ORDER BY id",
    [sale_id]
  );
  return result.rows;
};

export const createPayment = async (data) => {
  const { sale_id, amount, method } = data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paymentResult = await client.query(
      `INSERT INTO payments (sale_id, amount, method) VALUES ($1, $2, $3) RETURNING *`,
      [sale_id, amount, method ?? null]
    );
    const payment = paymentResult.rows[0];

    const sumResult = await client.query(
      "SELECT SUM(amount) AS total_pagado FROM payments WHERE sale_id = $1",
      [sale_id]
    );
    const totalPagado = parseFloat(sumResult.rows[0].total_pagado);

    const saleResult = await client.query(
      "SELECT total FROM sales WHERE id = $1",
      [sale_id]
    );
    const sale = saleResult.rows[0];

    if (sale && totalPagado >= parseFloat(sale.total)) {
      await client.query(
        "UPDATE sales SET status = 'paid' WHERE id = $1",
        [sale_id]
      );
    }

    await client.query("COMMIT");
    return payment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deletePayment = async (id) => {
  await pool.query("DELETE FROM payments WHERE id = $1", [id]);
};
