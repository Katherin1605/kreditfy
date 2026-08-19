import pool from '../../db/config.js';

// Auto-crear tabla de historial
pool.query(`
  CREATE TABLE IF NOT EXISTS exchange_rates_history (
    rate_date DATE PRIMARY KEY,
    usd_rate  NUMERIC(10,4) NOT NULL,
    eur_rate  NUMERIC(10,4),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('[exchange_rates_history] Error en migración:', err));

let cache = { USD: null, EUR: null, updatedAt: null };
const TTL = 60 * 60 * 1000; // 1 hora

const saveRateToHistory = (date, usdRate, eurRate) => {
  pool.query(
    `INSERT INTO exchange_rates_history (rate_date, usd_rate, eur_rate)
     VALUES ($1, $2, $3)
     ON CONFLICT (rate_date) DO UPDATE SET usd_rate = $2, eur_rate = $3, updated_at = NOW()`,
    [date, usdRate, eurRate]
  ).catch(() => {});
};

export const getExchangeRates = async () => {
  const now = Date.now();
  if (cache.USD && cache.updatedAt && (now - new Date(cache.updatedAt).getTime()) < TTL) {
    return { ...cache, fromCache: true };
  }

  try {
    const [usdRes, eurRes] = await Promise.all([
      fetch('https://ve.dolarapi.com/v1/dolares/oficial'),
      fetch('https://ve.dolarapi.com/v1/euros/oficial'),
    ]);
    const [usdData, eurData] = await Promise.all([usdRes.json(), eurRes.json()]);

    cache = {
      USD:       parseFloat(usdData.promedio),
      EUR:       parseFloat(eurData.promedio),
      updatedAt: usdData.fechaActualizacion,
    };

    const today = new Date().toISOString().slice(0, 10);
    saveRateToHistory(today, cache.USD, cache.EUR);

    return cache;
  } catch (err) {
    console.error('[exchange-rates] Error al obtener tasas BCV:', err.message);
    return cache.USD
      ? { ...cache, stale: true }
      : { USD: null, EUR: null, updatedAt: null, error: 'No disponible' };
  }
};

export const getRateForDate = async (date) => {
  const result = await pool.query(
    `SELECT usd_rate, eur_rate FROM exchange_rates_history
     WHERE rate_date <= $1 ORDER BY rate_date DESC LIMIT 1`,
    [date]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return { USD: parseFloat(row.usd_rate), EUR: row.eur_rate ? parseFloat(row.eur_rate) : null };
};
