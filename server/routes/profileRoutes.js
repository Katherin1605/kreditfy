import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../src/controllers/profileController.js';
import { authenticateToken } from '../src/middleware/authMiddleware.js';

const router = Router();

router.get('/profile',           authenticateToken, getProfile);
router.put('/profile',           authenticateToken, updateProfile);
router.put('/profile/password',  authenticateToken, changePassword);

export default router;
