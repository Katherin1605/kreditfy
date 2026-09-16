import pool from '../../db/config.js';

pool.query(`
  CREATE TABLE IF NOT EXISTS exchange_rates_history (
    rate_date DATE PRIMARY KEY,
    usd_rate  NUMERIC(10,4) NOT NULL,
    eur_rate  NUMERIC(10,4),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('[exchange_rates_history] Error en migración:', err));

let cache = { USD: null, EUR: null, updatedAt: null };
const TTL = 60 * 60 * 1000;
let historicalSeeded = false;

const saveRateToHistory = (date, usdRate, eurRate) => {
  pool.query(
    `INSERT INTO exchange_rates_history (rate_date, usd_rate, eur_rate)
     VALUES ($1, $2, $3)
     ON CONFLICT (rate_date) DO UPDATE SET usd_rate = $2, eur_rate = $3, updated_at = NOW()`,
    [date, usdRate, eurRate]
  ).catch(() => {});
};

const seedHistoricalRates = (usdHistory) => {
  if (historicalSeeded) return;
  historicalSeeded = true;
  for (const entry of usdHistory) {
    if (entry.fecha && entry.promedio) {
      saveRateToHistory(entry.fecha, parseFloat(entry.promedio), null);
    }
  }
  console.log(`[exchange-rates] Historial sembrado: ${usdHistory.length} registros`);
};

export const getExchangeRates = async () => {
  const now = Date.now();
  if (cache.USD && cache.updatedAt && (now - new Date(cache.updatedAt).getTime()) < TTL) {
    return { ...cache, fromCache: true };
  }

  try {
    const [usdHistRes, eurRes] = await Promise.all([
      fetch('https://ve.dolarapi.com/v1/historicos/dolares/oficial'),
      fetch('https://ve.dolarapi.com/v1/euros/oficial'),
    ]);
    const [usdHistory, eurData] = await Promise.all([usdHistRes.json(), eurRes.json()]);

    if (!Array.isArray(usdHistory) || usdHistory.length === 0) {
      throw new Error('Respuesta inválida del API histórico');
    }

    // La entrada más reciente = tasa actual
    const sorted = [...usdHistory].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    const latest = sorted[0];

    cache = {
      USD:       parseFloat(latest.promedio),
      EUR:       parseFloat(eurData.promedio),
      updatedAt: latest.fecha,
    };

    // Sembrar historial completo una sola vez por arranque del servidor
    seedHistoricalRates(usdHistory);
    // Siempre guardar la entrada actual (con EUR)
    saveRateToHistory(latest.fecha, cache.USD, cache.EUR);

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
