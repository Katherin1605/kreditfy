import { Router } from 'express';
import {
  getTenants, getTenantById, createTenant, updateTenant,
  getTenantAdmins, createTenantAdmin, toggleTenantAdmin, getPlatformStats,
} from '../src/controllers/platformController.js';
import { authenticateToken, requirePlatformAdmin } from '../src/middleware/authMiddleware.js';

const router = Router();

router.get('/platform/stats',                   authenticateToken, requirePlatformAdmin, getPlatformStats);
router.get('/platform/tenants',                 authenticateToken, requirePlatformAdmin, getTenants);
router.post('/platform/tenants',                authenticateToken, requirePlatformAdmin, createTenant);
router.get('/platform/tenants/:id',             authenticateToken, requirePlatformAdmin, getTenantById);
router.put('/platform/tenants/:id',             authenticateToken, requirePlatformAdmin, updateTenant);
router.get('/platform/tenants/:id/admins',                    authenticateToken, requirePlatformAdmin, getTenantAdmins);
router.post('/platform/tenants/:id/admins',                   authenticateToken, requirePlatformAdmin, createTenantAdmin);
router.put('/platform/tenants/:id/admins/:adminId/toggle',    authenticateToken, requirePlatformAdmin, toggleTenantAdmin);

export default router;
