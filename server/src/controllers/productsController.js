import * as productModel from "../models/productsModel.js";

export const getProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
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
    const newProduct = await productModel.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "El producto ya existe" });
    }
    res.status(500).json({ error: "Error al crear el producto" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await productModel.getProductById(id);
    if (!existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    const updated = await productModel.updateProduct(id, req.body);
    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "El producto ya existe" });
    }
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await productModel.getProductById(id);
    if (!existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    await productModel.deleteProduct(id);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
};
