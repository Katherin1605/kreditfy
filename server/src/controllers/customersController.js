import * as customerModel from "../models/customersModel.js";
import * as auditModel from "../models/auditModel.js";

export const getCustomers = async (req, res) => {
  try {
    const search = (req.query.q || '').trim();
    const { page = 1, limit = 20 } = req.query;
    const result = await customerModel.getAllCustomers({ search, page, limit, tenantId: req.tenantId });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { identity_card, name } = req.body;
    if (!identity_card || !name) {
      return res.status(400).json({ error: "Cédula y nombre son obligatorios" });
    }
    const newCustomer = await customerModel.createCustomer(req.body, req.tenantId);
    res.status(201).json(newCustomer);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'customers',
      record_id: newCustomer.id,
      description: `Creó cliente: ${newCustomer.name}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ error: "La cédula ya existe" });
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await customerModel.getCustomerById(req.params.id, req.tenantId);
    if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el cliente" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { identity_card, name } = req.body;
    if (!identity_card || !name) {
      return res.status(400).json({ error: "Cédula y nombre son obligatorios" });
    }
    const updated = await customerModel.updateCustomer(req.params.id, req.body, req.tenantId);
    if (!updated) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(updated);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'customers',
      record_id: parseInt(req.params.id),
      description: `Actualizó cliente ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ error: "La cédula ya existe" });
    res.status(500).json({ error: "Error al actualizar el cliente" });
  }
};

export const importCustomers = async (req, res) => {
  try {
    const { customers } = req.body;
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: 'No se enviaron clientes para importar' });
    }
    const invalid = customers.filter(c => !c.name?.trim() || !c.identity_card?.trim());
    if (invalid.length > 0) {
      return res.status(400).json({ error: `${invalid.length} fila(s) sin nombre o cédula` });
    }
    const result = await customerModel.importCustomers(customers, req.tenantId);
    res.json(result);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'customers',
      record_id: null,
      description: `Importó ${result.inserted} clientes desde CSV (${result.skipped} duplicados omitidos)`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al importar clientes' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const existing = await customerModel.getCustomerById(req.params.id, req.tenantId);
    if (!existing) return res.status(404).json({ error: "Cliente no encontrado" });
    await customerModel.deleteCustomer(req.params.id, req.tenantId);
    res.json({ message: "Cliente eliminado correctamente" });
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'customers',
      record_id: parseInt(req.params.id),
      description: `Eliminó cliente ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el cliente" });
  }
};
