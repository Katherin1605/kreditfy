import pool from "../../db/config.js";

export const createSaleWithDetails = async (saleData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { customer_id, products } = saleData;

    // 🔥 Calcular total
    const total = products.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0
    );

    // 🧾 Insertar venta
    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, total)
       VALUES ($1, $2)
       RETURNING *`,
      [customer_id, total]
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