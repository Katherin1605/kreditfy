import { Router } from 'express';
import {
  getPlanConfigs, updatePlanConfig,
  getTenants, getTenantById, createTenant, updateTenant, approveTenant,
  getTenantAdmins, createTenantAdmin, toggleTenantAdmin, resetTenantAdminPassword,
  uploadTenantLogo, uploadPlatformLogo, getPlatformStats, getTenantsBreakdown,
  getBackupInfo, triggerFullBackup, downloadTenantBackup, deleteTenant,
} from '../src/controllers/platformController.js';
import { authenticateToken, requirePlatformAdmin } from '../src/middleware/authMiddleware.js';
import { uploadLogo } from '../src/utils/upload.js';

const router = Router();

router.get('/platform/stats',                   authenticateToken, requirePlatformAdmin, getPlatformStats);
router.get('/platform/backup-info',             authenticateToken, requirePlatformAdmin, getBackupInfo);
router.post('/platform/backup',                 authenticateToken, requirePlatformAdmin, triggerFullBackup);
router.get('/platform/tenants/:id/backup',      authenticateToken, requirePlatformAdmin, downloadTenantBackup);
router.get('/platform/plan-configs',            authenticateToken, requirePlatformAdmin, getPlanConfigs);
router.put('/platform/plan-configs/:plan',      authenticateToken, requirePlatformAdmin, updatePlanConfig);
router.get('/platform/breakdown',               authenticateToken, requirePlatformAdmin, getTenantsBreakdown);
router.get('/platform/tenants',                 authenticateToken, requirePlatformAdmin, getTenants);
router.post('/platform/tenants',                authenticateToken, requirePlatformAdmin, createTenant);
router.get('/platform/tenants/:id',             authenticateToken, requirePlatformAdmin, getTenantById);
router.put('/platform/tenants/:id',             authenticateToken, requirePlatformAdmin, updateTenant);
router.post('/platform/tenants/:id/approve',    authenticateToken, requirePlatformAdmin, approveTenant);
router.delete('/platform/tenants/:id',          authenticateToken, requirePlatformAdmin, deleteTenant);
router.get('/platform/tenants/:id/admins',                    authenticateToken, requirePlatformAdmin, getTenantAdmins);
router.post('/platform/tenants/:id/admins',                   authenticateToken, requirePlatformAdmin, createTenantAdmin);
router.put('/platform/tenants/:id/admins/:adminId/toggle',          authenticateToken, requirePlatformAdmin, toggleTenantAdmin);
router.put('/platform/tenants/:id/admins/:adminId/reset-password',  authenticateToken, requirePlatformAdmin, resetTenantAdminPassword);
router.post('/platform/tenants/:id/logo',  authenticateToken, requirePlatformAdmin, uploadLogo.single('logo'), uploadTenantLogo);
router.post('/platform/logo',              authenticateToken, requirePlatformAdmin, uploadLogo.single('logo'), uploadPlatformLogo);

export default router;
