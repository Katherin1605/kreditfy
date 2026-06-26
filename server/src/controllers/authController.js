import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as authModel from "../models/authModel.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const ACCESS_SECRET  = process.env.JWT_PRIVATE         || "credishoping_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_PRIVATE || "credishoping_refresh_secret";

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
    if (admin) {
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
