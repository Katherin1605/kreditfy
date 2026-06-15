import pool from "../../db/config.js";

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
         s.status, s.created_at,
         COALESCE(SUM(p.amount), 0) AS total_paid,
         s.total - COALESCE(SUM(p.amount), 0) AS balance
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN payments p ON s.id = p.sale_id
       ${where}
       GROUP BY s.id, c.name
       ORDER BY s.created_at DESC
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

    const { customer_id, products, cuotas = 1 } = saleData;

    // Calcular total
    const total = products.reduce(
      (sum, p) => sum + p.quantity * p.price,
      0
    );

    // Insertar venta
    const saleResult = await client.query(
      `INSERT INTO sales (customer_id, total, cuotas)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [customer_id, total, cuotas]
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

    const { customer_id, products, cuotas = 1 } = saleData;

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

    // Actualizar la venta
    const saleResult = await client.query(
      `UPDATE sales SET customer_id = $1, total = $2, cuotas = $3 WHERE id = $4 RETURNING *`,
      [customer_id, total, cuotas, id]
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