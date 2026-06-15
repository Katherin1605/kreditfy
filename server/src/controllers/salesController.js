import * as salesModel from "../models/salesModel.js";
import * as auditModel from "../models/auditModel.js";

export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 15, q = '' } = req.query;
    const data = await salesModel.getAllSales({ page, limit, q });
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

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'sales',
      record_id: sale.id,
      description: `Creó venta ID ${sale.id}`,
    }).catch(() => {});

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

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'sales',
      record_id: parseInt(req.params.id),
      description: `Eliminó venta ID ${req.params.id}`,
    }).catch(() => {});
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

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'sales',
      record_id: parseInt(req.params.id),
      description: `Actualizó venta ID ${req.params.id}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);

    if (error.message && error.message.includes("Stock insuficiente")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Error al actualizar la venta" });
  }
};