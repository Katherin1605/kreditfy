import * as adminModel from "../models/adminModel.js";

export const getAdmins = async (req, res) => {
  try {
    const admins = await adminModel.getAllAdmins();
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener administradores" });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.id);
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
    const newAdmin = await adminModel.createAdmin(req.body);
    res.status(201).json(newAdmin);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    res.status(500).json({ error: "Error al crear administrador" });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nombre y email son obligatorios" });
    }
    const updated = await adminModel.updateAdmin(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Administrador no encontrado" });
    res.json(updated);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    res.status(500).json({ error: "Error al actualizar administrador" });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.id);
    if (!admin) return res.status(404).json({ error: "Administrador no encontrado" });
    await adminModel.deleteAdmin(req.params.id);
    res.json({ message: "Administrador eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar administrador" });
  }
};
