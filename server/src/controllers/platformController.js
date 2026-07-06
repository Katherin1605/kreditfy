import bcrypt from "bcryptjs";
import * as platformModel from "../models/platformModel.js";
import * as adminModel from "../models/adminModel.js";
import { runFullBackup, getLastBackupInfo, generateTenantDump } from "../utils/backup.js";
import { uploadToCloudinary } from "../utils/cloudinaryConfig.js";
import { sendApprovalEmail } from "../utils/mailer.js";

export const getPlanConfigs = async (req, res) => {
  try {
    const configs = await platformModel.getPlanConfigs();
    res.json(configs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración de planes' });
  }
};

export const updatePlanConfig = async (req, res) => {
  try {
    const { plan } = req.params;
    const { max_admins, modules } = req.body;
    if (!Array.isArray(modules)) return res.status(400).json({ error: 'modules debe ser un array' });
    const config = await platformModel.updatePlanConfig(plan, { max_admins: parseInt(max_admins), modules });
    if (!config) return res.status(404).json({ error: 'Plan no encontrado' });
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
};

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
    const tenantInfo = await platformModel.getTenantWithPlan(req.params.id);
    if (!tenantInfo) return res.status(404).json({ error: 'Tenant no encontrado' });
    if (tenantInfo.plan_max_admins !== -1) {
      const count = await platformModel.getAdminCount(req.params.id);
      if (count >= tenantInfo.plan_max_admins) {
        return res.status(400).json({
          error: `El plan ${tenantInfo.plan} permite máximo ${tenantInfo.plan_max_admins} administrador(es)`
        });
      }
    }
    const admin = await adminModel.createAdmin({ name, email, password, role }, parseInt(req.params.id));
    res.status(201).json(admin);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al crear administrador del tenant' });
  }
};

export const resetTenantAdminPassword = async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'La contraseña es obligatoria' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const admin = await platformModel.resetAdminPassword(req.params.adminId, req.params.id, hashed);
    if (!admin) return res.status(404).json({ error: 'Administrador no encontrado' });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la contraseña' });
  }
};

export const uploadTenantLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const result = await uploadToCloudinary(req.file.buffer);
    const tenant = await platformModel.updateTenantLogo(req.params.id, result.secure_url);
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json({ logo_url: result.secure_url, tenant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir el logo' });
  }
};

export const uploadPlatformLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const result = await uploadToCloudinary(req.file.buffer, 'kreditfy/platform');
    await platformModel.updateAdminLogo(req.admin.id, result.secure_url);
    res.json({ logo_url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir el logo' });
  }
};

export const approveTenant = async (req, res) => {
  try {
    const result = await platformModel.approveTenant(req.params.id);
    if (!result?.tenant) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(result.tenant);
    if (result.adminEmail) {
      sendApprovalEmail(result.adminEmail, result.tenant.name).catch(err =>
        console.error('⚠️  Error enviando email de aprobación:', err.message)
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar el tenant' });
  }
};

export const deleteTenant = async (req, res) => {
  try {
    const tenant = await platformModel.deleteTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json({ message: 'Tenant eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el tenant' });
  }
};

export const toggleTenantAdmin = async (req, res) => {
  try {
    const admin = await platformModel.toggleAdminActive(req.params.adminId, req.params.id);
    if (!admin) return res.status(404).json({ error: 'Administrador no encontrado' });
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado del administrador' });
  }
};

export const deleteTenantAdmin = async (req, res) => {
  try {
    const admin = await adminModel.getAdminById(req.params.adminId, parseInt(req.params.id));
    if (!admin) return res.status(404).json({ error: 'Administrador no encontrado' });
    await adminModel.deleteAdmin(req.params.adminId, parseInt(req.params.id));
    res.json({ message: 'Administrador eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar administrador' });
  }
};

export const getTenantsBreakdown = async (req, res) => {
  try {
    const rows = await platformModel.getTenantsBreakdown();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener desglose por tenant' });
  }
};

export const getBackupInfo = async (req, res) => {
  try {
    const info = await getLastBackupInfo();
    res.json(info);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estado del backup' });
  }
};

export const triggerFullBackup = async (req, res) => {
  try {
    const result = await runFullBackup();
    res.json({ message: 'Backup completado', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al ejecutar backup. Verifica que pg_dump esté instalado.' });
  }
};

export const downloadTenantBackup = async (req, res) => {
  try {
    const tenant = await platformModel.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant no encontrado' });

    const sql      = await generateTenantDump(req.params.id, tenant.name);
    const date     = new Date().toISOString().slice(0, 10);
    const filename = `backup_${tenant.slug}_${date}.sql`;

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el backup del tenant' });
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
