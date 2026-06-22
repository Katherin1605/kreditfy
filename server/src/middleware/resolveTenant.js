export const resolveTenant = (req, res, next) => {
  if (req.admin.role === 'platform_admin') {
    req.tenantId = null;
    return next();
  }
  if (!req.admin.tenant_id) {
    return res.status(403).json({ error: 'Sin tenant asignado' });
  }
  req.tenantId = req.admin.tenant_id;
  next();
};
