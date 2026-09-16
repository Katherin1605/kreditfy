import pool from "../../db/config.js";

export const getAllProducts = async (tenantId) => {
  const params = [];
  let where = '';
  if (tenantId != null) { where = 'WHERE tenant_id = $1'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM products ${where} ORDER BY id`, params);
  return result.rows;
};

export const getProductById = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  const result = await pool.query(`SELECT * FROM products ${where}`, params);
  return result.rows[0];
};

export const createProduct = async (product, tenantId) => {
  const { name, description, price, cost_price, stock, sku } = product;
  const result = await pool.query(
    `INSERT INTO products (name, description, price, cost_price, stock, sku, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, description, price, cost_price ?? null, stock ?? 0, sku?.trim() || null, tenantId]
  );
  return result.rows[0];
};

export const updateProduct = async (id, product, tenantId) => {
  const { name, description, price, cost_price, stock, sku } = product;
  const params = [name, description, price, cost_price ?? null, stock, sku?.trim() || null, id];
  let where = 'WHERE id = $7';
  if (tenantId != null) { where += ' AND tenant_id = $8'; params.push(tenantId); }
  const result = await pool.query(
    `UPDATE products SET name = $1, description = $2, price = $3, cost_price = $4, stock = $5, sku = $6 ${where} RETURNING *`,
    params
  );
  return result.rows[0];
};

export const updateProductCostPrice = async (id, costPrice, tenantId) => {
  const params = [costPrice, id];
  let where = 'WHERE id = $2';
  if (tenantId != null) { where += ' AND tenant_id = $3'; params.push(tenantId); }
  await pool.query(`UPDATE products SET cost_price = $1 ${where}`, params);
};

export const deleteProduct = async (id, tenantId) => {
  const params = [id];
  let where = 'WHERE id = $1';
  if (tenantId != null) { where += ' AND tenant_id = $2'; params.push(tenantId); }
  await pool.query(`DELETE FROM products ${where}`, params);
};

export const importProducts = async (products, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    let updated  = 0;
    for (const p of products) {
      const sku       = p.sku?.trim() || null;
      const price     = parseFloat(p.price);
      const costPrice = p.cost_price != null && !isNaN(parseFloat(p.cost_price)) ? parseFloat(p.cost_price) : null;
      const stock     = parseInt(p.stock) || 0;

      if (sku) {
        // Upsert por SKU: si ya existe suma stock y actualiza precios/nombre
        const res = await client.query(
          `INSERT INTO products (name, description, price, cost_price, stock, sku, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (sku, tenant_id) WHERE sku IS NOT NULL AND sku <> ''
           DO UPDATE SET
             name        = EXCLUDED.name,
             description = COALESCE(NULLIF(EXCLUDED.description, ''), products.description),
             price       = EXCLUDED.price,
             cost_price  = COALESCE(EXCLUDED.cost_price, products.cost_price),
             stock       = products.stock + EXCLUDED.stock
           RETURNING xmax`,
          [p.name, p.description || '', price, costPrice, stock, sku, tenantId]
        );
        const xmax = res.rows[0]?.xmax;
        if (xmax === '0' || xmax === 0) inserted++;
        else updated++;
      } else {
        // Sin SKU → buscar por nombre (case-insensitive); si existe actualizar, si no insertar
        const existing = await client.query(
          `SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND tenant_id = $2 LIMIT 1`,
          [p.name, tenantId]
        );
        if (existing.rows.length > 0) {
          await client.query(
            `UPDATE products SET
               price       = $1,
               cost_price  = COALESCE($2, cost_price),
               stock       = stock + $3,
               description = COALESCE(NULLIF($4, ''), description)
             WHERE id = $5`,
            [price, costPrice, stock, p.description || '', existing.rows[0].id]
          );
          updated++;
        } else {
          await client.query(
            `INSERT INTO products (name, description, price, cost_price, stock, sku, tenant_id)
             VALUES ($1, $2, $3, $4, $5, NULL, $6)`,
            [p.name, p.description || '', price, costPrice, stock, tenantId]
          );
          inserted++;
        }
      }
    }
    await client.query('COMMIT');
    return { inserted, updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
