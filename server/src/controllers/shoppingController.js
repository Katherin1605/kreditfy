import * as shoppingModel from "../models/shoppingModel.js";
import * as auditModel from "../models/auditModel.js";

export const getAllShopping = async (req, res) => {
  try {
    const data = await shoppingModel.getAllShopping();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las compras" });
  }
};

export const getShoppingById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopping = await shoppingModel.getShoppingById(id);
    if (!shopping) return res.status(404).json({ error: "Compra no encontrada" });
    res.json(shopping);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la compra" });
  }
};

export const getShoppingByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;
    const data = await shoppingModel.getShoppingByProductId(product_id);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las compras del producto" });
  }
};

export const createShopping = async (req, res) => {
  try {
    const { product_id, quantity, cost } = req.body;
    if (!product_id || quantity === undefined || quantity === null || cost === undefined || cost === null) {
      return res.status(400).json({ error: "product_id, quantity y cost son obligatorios" });
    }
    const newShopping = await shoppingModel.createShopping(req.body);
    res.status(201).json(newShopping);

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'shopping',
      record_id: newShopping.id,
      description: `Registró compra de ${newShopping.quantity} unidades (producto ID ${newShopping.product_id})`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23503") return res.status(400).json({ error: "El producto especificado no existe" });
    res.status(500).json({ error: "Error al registrar la compra" });
  }
};

export const deleteShopping = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await shoppingModel.getShoppingById(id);
    if (!existing) return res.status(404).json({ error: "Compra no encontrada" });
    await shoppingModel.deleteShopping(id);
    res.json({ message: "Compra eliminada correctamente" });

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'shopping',
      record_id: parseInt(req.params.id),
      description: `Eliminó compra ID ${req.params.id}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la compra" });
  }
};
