import * as dashboardModel from "../models/dashboardModel.js";

export const getStats = async (req, res) => {
  try {
    const stats = await dashboardModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estadísticas del dashboard" });
  }
};

export const getMonthlyStats = async (req, res) => {
  try {
    const data = await dashboardModel.getMonthlyStats();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estadísticas mensuales" });
  }
};
