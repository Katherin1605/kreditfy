import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as authModel from "../models/authModel.js";

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

    const payload = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    };
    const token = jwt.sign(payload, process.env.JWT_PRIVATE || "credishoping_secret", { expiresIn: "8h" });
    res.json({ token, admin: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};
