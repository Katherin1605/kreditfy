import * as earningsModel from "../models/earningsModel.js";

export const getMonthlySummary = async (req, res) => {
  try {
    const { year, currency = '' } = req.query;
    const data = await earningsModel.getMonthlySummary(year, currency, req.tenantId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el resumen de cobros" });
  }
};

export const updateClosing = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { notas, cerrado } = req.body;
    const result = await earningsModel.upsertClosing(
      parseInt(year),
      parseInt(month),
      { notas, cerrado },
      req.tenantId
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar el cierre mensual" });
  }
};

export const getAvailableYears = async (req, res) => {
  try {
    const years = await earningsModel.getAvailableYears(req.tenantId);
    res.json(years);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los años disponibles" });
  }
};
