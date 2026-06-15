import * as earningsModel from "../models/earningsModel.js";

export const getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const data = await earningsModel.getMonthlySummary(year);
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
      { notas, cerrado }
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar el cierre mensual" });
  }
};

export const getAvailableYears = async (req, res) => {
  try {
    const years = await earningsModel.getAvailableYears();
    res.json(years);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los años disponibles" });
  }
};
