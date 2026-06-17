import { getExchangeRates } from "../models/exchangeRatesModel.js";

export const getRates = async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tasas de cambio" });
  }
};
