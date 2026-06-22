import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de acceso requerido' });
  jwt.verify(token, process.env.JWT_PRIVATE || 'credishoping_secret', (err, admin) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.admin = admin;
    next();
  });
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso restringido a superadmin' });
  }
  next();
};

export const requirePlatformAdmin = (req, res, next) => {
  if (req.admin?.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Acceso restringido a platform admin' });
  }
  next();
};
