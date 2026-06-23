import * as adminModel from "../models/adminModel.js";
import * as auditModel from "../models/auditModel.js";

export const getAdmins = async (req, res) => {
  try {
    const admins = await adminModel.getAllAdmins(req.tenantId);
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener administradores" });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.id, req.tenantId);
    if (!admin) return res.status(404).json({ error: "Administrador no encontrado" });
    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener administrador" });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }
    const newAdmin = await adminModel.createAdmin(req.body, req.tenantId);
    res.status(201).json(newAdmin);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'CREATE',
      table_name: 'admins',
      record_id: newAdmin.id,
      description: `Creó administrador: ${newAdmin.name}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ error: "El email ya está registrado" });
    res.status(500).json({ error: "Error al crear administrador" });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nombre y email son obligatorios" });
    }
    const updated = await adminModel.updateAdmin(req.params.id, req.body, req.tenantId);
    if (!updated) return res.status(404).json({ error: "Administrador no encontrado" });
    res.json(updated);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'admins',
      record_id: parseInt(req.params.id),
      description: `Actualizó administrador ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ error: "El email ya está registrado" });
    res.status(500).json({ error: "Error al actualizar administrador" });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.id, req.tenantId);
    if (!admin) return res.status(404).json({ error: "Administrador no encontrado" });
    await adminModel.deleteAdmin(req.params.id, req.tenantId);
    res.json({ message: "Administrador eliminado correctamente" });
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'DELETE',
      table_name: 'admins',
      record_id: parseInt(req.params.id),
      description: `Eliminó administrador ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar administrador" });
  }
};

export const toggleAdminActive = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.id, req.tenantId);
    if (!admin) return res.status(404).json({ error: "Administrador no encontrado" });
    const updated = await adminModel.updateAdminActive(req.params.id, !admin.active, req.tenantId);
    res.json(updated);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'admins',
      record_id: parseInt(req.params.id),
      description: `Cambió estado de administrador ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar estado del administrador" });
  }
};

export const updateAdminPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: "permissions debe ser un array" });
    }
    const updated = await adminModel.updateAdminPermissions(req.params.id, permissions, req.tenantId);
    if (!updated) return res.status(404).json({ error: "Administrador no encontrado" });
    res.json(updated);
    auditModel.createAuditLog({
      admin_id: req.admin?.id || null,
      action: 'UPDATE',
      table_name: 'admins',
      record_id: parseInt(req.params.id),
      description: `Actualizó permisos de administrador ID ${req.params.id}`,
      tenant_id: req.tenantId,
    }).catch(() => {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar permisos" });
  }
};
