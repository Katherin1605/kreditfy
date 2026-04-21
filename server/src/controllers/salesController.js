import * as salesModel from "../models/salesModel.js";

export const createSale = async (req, res) => {
  try {
    const { customer_id, products } = req.body;

    // Validaciones básicas
    if (!products || products.length === 0) {
      return res.status(400).json({ error: "Debe incluir productos" });
    }

    const sale = await salesModel.createSaleWithDetails(req.body);

    res.status(201).json(sale);

  } catch (error) {
    console.error(error);

    if (error.message.includes("Stock insuficiente")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error al crear la venta" });
  }
};