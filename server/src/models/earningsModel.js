import pool from "../../db/config.js";

// Crea la tabla si no existe al cargar el módulo
pool.query(`
  CREATE TABLE IF NOT EXISTS monthly_closings (
    id         SERIAL PRIMARY KEY,
    year       INTEGER NOT NULL,
    month      INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    notas      TEXT,
    cerrado    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (year, month)
  )
`).catch(err => console.error('[earnings] Error creando monthly_closings:', err));

export const getMonthlySummary = async (year) => {
  const targetYear = parseInt(year) || new Date().getFullYear();

  const [ingresosRes, gastosRes, closingsRes] = await Promise.all([
    pool.query(
      `SELECT EXTRACT(MONTH FROM payment_date)::int AS month,
              SUM(amount)::numeric                    AS ingresos
       FROM payments
       WHERE EXTRACT(YEAR FROM payment_date) = $1
       GROUP BY EXTRACT(MONTH FROM payment_date)`,
      [targetYear]
    ),
    pool.query(
      `SELECT EXTRACT(MONTH FROM date)::int AS month,
              SUM(cost * quantity)::numeric  AS gastos
       FROM shopping
       WHERE EXTRACT(YEAR FROM date) = $1
       GROUP BY EXTRACT(MONTH FROM date)`,
      [targetYear]
    ),
    pool.query(
      `SELECT * FROM monthly_closings WHERE year = $1`,
      [targetYear]
    ),
  ]);

  const MONTH_NAMES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const ingRow   = ingresosRes.rows.find(r => r.month === m);
    const gasRow   = gastosRes.rows.find(r => r.month === m);
    const closing  = closingsRes.rows.find(r => r.month === m);

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
      socio_1:    ganancia / 2,
      socio_2:    ganancia / 2,
      cerrado:    closing?.cerrado  || false,
      notas:      closing?.notas    || null,
    });
  }

  return months;
};

export const upsertClosing = async (year, month, { notas, cerrado }) => {
  const result = await pool.query(
    `INSERT INTO monthly_closings (year, month, notas, cerrado)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (year, month) DO UPDATE
       SET notas = EXCLUDED.notas, cerrado = EXCLUDED.cerrado
     RETURNING *`,
    [year, month, notas ?? null, cerrado ?? false]
  );
  return result.rows[0];
};

export const getAvailableYears = async () => {
  const result = await pool.query(
    `SELECT DISTINCT EXTRACT(YEAR FROM payment_date)::int AS year
     FROM payments
     ORDER BY year DESC`
  );
  return result.rows.map(r => r.year);
};
