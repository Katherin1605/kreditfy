let cache = { USD: null, EUR: null, updatedAt: null };
const TTL = 60 * 60 * 1000; // 1 hora

export const getExchangeRates = async () => {
  const now = Date.now();
  if (cache.USD && cache.updatedAt && (now - cache.updatedAt) < TTL) {
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
    return cache;
  } catch (err) {
    console.error('[exchange-rates] Error al obtener tasas BCV:', err.message);
    return cache.USD
      ? { ...cache, stale: true }
      : { USD: null, EUR: null, updatedAt: null, error: 'No disponible' };
  }
};
