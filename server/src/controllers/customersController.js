import * as customerModel from "../models/customersModel.js";
import * as auditModel from "../models/auditModel.js";

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

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'customers',
      record_id: newCustomer.id,
      description: `Creó cliente: ${newCustomer.name}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);

    // Manejo de error por duplicado (cedula unique)
    if (error.code === "23505") {
      return res.status(400).json({ error: "La cédula ya existe" });
    }

    res.status(500).json({ error: "Error al crear cliente" });
  }
};

// GET /customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerModel.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el cliente" });
  }
};

// PUT /customers/:id
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { identity_card, name } = req.body;

    if (!identity_card || !name) {
      return res.status(400).json({ error: "Cédula y nombre son obligatorios" });
    }

    const updated = await customerModel.updateCustomer(id, req.body);

    if (!updated) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(updated);

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'customers',
      record_id: parseInt(req.params.id),
      description: `Actualizó cliente ID ${req.params.id}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({ error: "La cédula ya existe" });
    }

    res.status(500).json({ error: "Error al actualizar el cliente" });
  }
};

// DELETE /customers/:id
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await customerModel.getCustomerById(id);

    if (!existing) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    await customerModel.deleteCustomer(id);
    res.json({ message: "Cliente eliminado correctamente" });

    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'customers',
      record_id: parseInt(req.params.id),
      description: `Eliminó cliente ID ${req.params.id}`,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el cliente" });
  }
};