import * as platformModel from "../models/platformModel.js";
import * as adminModel from "../models/adminModel.js";

export const getTenants = async (req, res) => {
  try {
    const tenants = await platformModel.getAllTenants();
    res.json(tenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tenants' });
  }
};

export const getTenantById = async (req, res) => {
  try {
    const tenant = await platformModel.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(tenant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el tenant' });
  }
};

export const createTenant = async (req, res) => {
  try {
    const { name, slug, currency, logo_url } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Nombre y slug son obligatorios' });
    const tenant = await platformModel.createTenant({ name, slug, currency, logo_url });
    res.status(201).json(tenant);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'El slug ya existe' });
    res.status(500).json({ error: 'Error al crear tenant' });
  }
};

export const updateTenant = async (req, res) => {
  try {
    const tenant = await platformModel.updateTenant(req.params.id, req.body);
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(tenant);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'El slug ya existe' });
    res.status(500).json({ error: 'Error al actualizar tenant' });
  }
};

export const getTenantAdmins = async (req, res) => {
  try {
    const admins = await platformModel.getAdminsByTenant(req.params.id);
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener administradores del tenant' });
  }
};

export const createTenantAdmin = async (req, res) => {
  try {
    const { name, email, password, role = 'superadmin' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }
    const admin = await adminModel.createAdmin({ name, email, password, role }, parseInt(req.params.id));
    res.status(201).json(admin);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al crear administrador del tenant' });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const stats = await platformModel.getPlatformStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas globales' });
  }
};
