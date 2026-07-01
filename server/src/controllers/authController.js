import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as authModel from "../models/authModel.js";
import * as platformModel from "../models/platformModel.js";
import * as adminModel from "../models/adminModel.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const ACCESS_SECRET  = process.env.JWT_PRIVATE         || "kreditfy_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_PRIVATE || "kreditfy_refresh_secret";

const buildPayload = (admin) => ({
  id:          admin.id,
  name:        admin.name,
  email:       admin.email,
  role:        admin.role,
  permissions: admin.permissions || [],
  tenant_id:   admin.tenant_id   ?? null,
  tenant_name: admin.tenant_name ?? null,
  tenant_logo: admin.tenant_logo ?? null,
  plan_modules: admin.plan_modules ?? null,
});

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const admin = await authModel.findAdminByEmail(email);
    if (!admin) return res.status(401).json({ error: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

    if (!admin.active) {
      if (admin.tenant_pending_review) {
        return res.status(403).json({ error: "Tu cuenta está pendiente de aprobación. Recibirás acceso una vez que el equipo de Kreditfy active tu empresa." });
      }
      return res.status(403).json({ error: "Tu cuenta ha sido desactivada. Contacta al administrador." });
    }

    const payload      = buildPayload(admin);
    const token        = jwt.sign(payload, ACCESS_SECRET,  { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: admin.id }, REFRESH_SECRET, { expiresIn: "7d" });

    res.json({ token, refreshToken, admin: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es obligatorio' });

  try {
    const admin = await authModel.findAdminByEmail(email);
    if (admin && admin.active) {
      const token    = crypto.randomBytes(32).toString('hex');
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await authModel.createResetToken(admin.id, token);
      await sendPasswordResetEmail(admin.email, resetUrl);
    }
    // Siempre responde igual para no revelar si el email existe
    res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña son obligatorios' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  try {
    const record = await authModel.findValidResetToken(token);
    if (!record) return res.status(400).json({ error: 'El enlace no es válido o ya expiró' });

    const hashed = await bcrypt.hash(password, 10);
    await authModel.updateAdminPassword(record.admin_id, hashed);
    await authModel.markTokenUsed(token);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

export const registerTenant = async (req, res) => {
  const { company_name, slug, admin_name, email, password } = req.body;
  if (!company_name || !slug || !admin_name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  try {
    const tenant = await platformModel.createTenantPending({ name: company_name, slug });
    await adminModel.createAdmin(
      { name: admin_name, email, password, role: 'superadmin' },
      tenant.id,
      false
    );
    res.status(201).json({ message: 'Solicitud recibida. El equipo de Kreditfy la revisará y te notificará cuando tu empresa esté activa.' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      if (err.detail?.includes('slug')) return res.status(400).json({ error: 'El identificador (slug) ya está registrado' });
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al procesar el registro' });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token requerido" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const admin = await authModel.findAdminById(decoded.id);
    if (!admin) return res.status(401).json({ error: "Admin no encontrado" });

    const payload      = buildPayload(admin);
    const token        = jwt.sign(payload, ACCESS_SECRET,  { expiresIn: "15m" });
    const newRefresh   = jwt.sign({ id: admin.id }, REFRESH_SECRET, { expiresIn: "7d" });

    res.json({ token, refreshToken: newRefresh });
  } catch (error) {
    res.status(401).json({ error: "Refresh token inválido o expirado" });
  }
};
