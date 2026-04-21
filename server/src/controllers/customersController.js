import * as customerModel from "../models/customersModel.js";

// GET /customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await customerModel.getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

// POST /customers
export const createCustomer = async (req, res) => {
  try {
    const { identity_card, name } = req.body;

    // Validación simple
    if (!identity_card || !name) {
      return res.status(400).json({ error: "Cédula y nombre son obligatorios" });
    }

    const newCustomer = await customerModel.createCustomer(req.body);

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error(error);

    // Manejo de error por duplicado (cedula unique)
    if (error.code === "23505") {
      return res.status(400).json({ error: "La cédula ya existe" });
    }

    res.status(500).json({ error: "Error al crear cliente" });
  }
};