import * as dashboardModel from "../models/dashboardModel.js";
import * as platformModel from "../models/platformModel.js";

export const getStats = async (req, res) => {
  try {
    let threshold = 5;
    if (req.tenantId != null) {
      const settings = await platformModel.getTenantSettings(req.tenantId);
      threshold = settings?.low_stock_threshold ?? 5;
    }
    const stats = await dashboardModel.getStats(req.tenantId, threshold);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estadísticas del dashboard" });
  }
};

export const getMonthlyStats = async (req, res) => {
  try {
    const data = await dashboardModel.getMonthlyStats(req.tenantId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estadísticas mensuales" });
  }
};
