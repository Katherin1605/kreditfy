import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../db/config.js';
import * as authModel from '../models/authModel.js';

const ACCESS_SECRET = process.env.JWT_PRIVATE || 'kreditfy_secret';

const buildPayload = (admin) => ({
  id:           admin.id,
  name:         admin.name,
  email:        admin.email,
  role:         admin.role,
  permissions:  admin.permissions || [],
  tenant_id:    admin.tenant_id    ?? null,
  tenant_name:  admin.tenant_name  ?? null,
  tenant_logo:  admin.role === 'platform_admin'
                  ? (admin.logo_url ?? null)
                  : (admin.tenant_logo ?? null),
  plan_modules: admin.plan_modules ?? null,
});

export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM admins WHERE id = $1',
      [req.admin.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
    }
    await pool.query(
      'UPDATE admins SET name = $1, email = $2 WHERE id = $3',
      [name.trim(), email.trim().toLowerCase(), req.admin.id]
    );
    const admin = await authModel.findAdminById(req.admin.id);
    if (!admin) return res.status(404).json({ error: 'Perfil no encontrado' });

    const payload = buildPayload(admin);
    const token   = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
    res.json({ admin: payload, token });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Este correo ya está en uso por otra cuenta en este negocio' });
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    const result = await pool.query('SELECT password FROM admins WHERE id = $1', [req.admin.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Perfil no encontrado' });

    const valid = await bcrypt.compare(current_password, result.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashed, req.admin.id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};
