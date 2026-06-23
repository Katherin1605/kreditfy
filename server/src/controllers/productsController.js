import * as productModel from "../models/productsModel.js";
import * as auditModel from "../models/auditModel.js";

export const getProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts(req.tenantId);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id, req.tenantId);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: "Nombre y precio son obligatorios" });
    }
    const newProduct = await productModel.createProduct(req.body, req.tenantId);
    res.status(201).json(newProduct);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'products',
      record_id: newProduct.id,
      description: `Creó producto: ${newProduct.name}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ error: "El producto ya existe" });
    res.status(500).json({ error: "Error al crear el producto" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const existing = await productModel.getProductById(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: "Producto no encontrado" });
    const updated = await productModel.updateProduct(req.params.id, req.body, req.tenantId);
    res.json(updated);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'products',
      record_id: parseInt(req.params.id),
      description: `Actualizó producto ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ error: "El producto ya existe" });
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const existing = await productModel.getProductById(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: "Producto no encontrado" });
    await productModel.deleteProduct(req.params.id, req.tenantId);
    res.json({ message: "Producto eliminado correctamente" });
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'products',
      record_id: parseInt(req.params.id),
      description: `Eliminó producto ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};
