import * as salesModel from "../models/salesModel.js";

export const getSales = async (req, res) => {
  try {
    const data = await salesModel.getAllSales();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las ventas" });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await salesModel.getSaleById(id);
    if (!sale) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }
    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la venta" });
  }
};

export const createSale = async (req, res) => {
  try {
    const { customer_id, products, cuotas } = req.body;

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

export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await salesModel.getSaleById(id);
    if (!sale) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    await salesModel.deleteSaleById(id);

    res.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    console.error(error);

    if (error.message && error.message.includes("Stock insuficiente")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error al eliminar la venta" });
  }
};

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { products, cuotas } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: "Debe incluir productos" });
    }

    const sale = await salesModel.getSaleById(id);
    if (!sale) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const updated = await salesModel.updateSaleById(id, req.body);

    res.json(updated);
  } catch (error) {
    console.error(error);

    if (error.message && error.message.includes("Stock insuficiente")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error al actualizar la venta" });
  }
};