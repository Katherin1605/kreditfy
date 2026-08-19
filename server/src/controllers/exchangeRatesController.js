import { getExchangeRates, getRateForDate } from "../models/exchangeRatesModel.js";

export const getRates = async (req, res) => {
  try {
    const { date } = req.query;

    if (date) {
      const today = new Date().toISOString().slice(0, 10);
      if (date >= today) {
        const rates = await getExchangeRates();
        return res.json(rates);
      }
      const historical = await getRateForDate(date);
      if (historical) return res.json(historical);
      // Si no hay histórico para esa fecha, devuelve la tasa actual
    }

    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tasas de cambio" });
  }
};
