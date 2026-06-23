import pool from "../../db/config.js";

export const getMonthlySummary = async (year, currency = '', tenantId) => {
  const targetYear = parseInt(year) || new Date().getFullYear();
  const params = [targetYear];
  let idx = 2;

  let tenantFilter = '';
  if (tenantId != null) {
    tenantFilter = `AND tenant_id = $${idx++}`;
    params.push(tenantId);
  }
  const cFilter = currency ? ` AND currency = $${idx++}` : '';
  if (currency) params.push(currency);

  const [ingresosRes, gastosRes, closingsRes] = await Promise.all([
    pool.query(
      `SELECT EXTRACT(MONTH FROM payment_date)::int AS month,
              SUM(amount)::numeric                    AS ingresos
       FROM payments
       WHERE EXTRACT(YEAR FROM payment_date) = $1 ${tenantFilter}${cFilter}
       GROUP BY EXTRACT(MONTH FROM payment_date)`,
      params
    ),
    pool.query(
      `SELECT EXTRACT(MONTH FROM date)::int AS month,
              SUM(cost * quantity)::numeric  AS gastos
       FROM shopping
       WHERE EXTRACT(YEAR FROM date) = $1 ${tenantFilter}${cFilter}
       GROUP BY EXTRACT(MONTH FROM date)`,
      params
    ),
    pool.query(
      `SELECT * FROM monthly_closings WHERE year = $1 ${tenantId != null ? `AND tenant_id = $2` : ''}`,
      tenantId != null ? [targetYear, tenantId] : [targetYear]
    ),
  ]);

  const MONTH_NAMES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const ingRow  = ingresosRes.rows.find(r => r.month === m);
    const gasRow  = gastosRes.rows.find(r => r.month === m);
    const closing = closingsRes.rows.find(r => r.month === m);

    const ingresos = parseFloat(ingRow?.ingresos || 0);
    const gastos   = parseFloat(gasRow?.gastos   || 0);
    const ganancia = ingresos - gastos;

    months.push({
      month:      m,
      month_name: MONTH_NAMES[m],
      year:       targetYear,
      ingresos,
      gastos,
      ganancia,
      socio_1:   ganancia / 2,
      socio_2:   ganancia / 2,
      cerrado:   closing?.cerrado || false,
      notas:     closing?.notas   || null,
    });
  }

  return months;
};

export const upsertClosing = async (year, month, { notas, cerrado }, tenantId) => {
  const result = await pool.query(
    `INSERT INTO monthly_closings (year, month, notas, cerrado, tenant_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (year, month, tenant_id) DO UPDATE
       SET notas = EXCLUDED.notas, cerrado = EXCLUDED.cerrado
     RETURNING *`,
    [year, month, notas ?? null, cerrado ?? false, tenantId]
  );
  return result.rows[0];
};

export const getAvailableYears = async (tenantId) => {
  const params = [];
  let where = '';
  if (tenantId != null) { where = 'WHERE tenant_id = $1'; params.push(tenantId); }
  const result = await pool.query(
    `SELECT DISTINCT EXTRACT(YEAR FROM payment_date)::int AS year
     FROM payments ${where}
     ORDER BY year DESC`,
    params
  );
  return result.rows.map(r => r.year);
};
