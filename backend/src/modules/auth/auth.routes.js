import { Router } from 'express';
import { register, login, getMe, checkAdmin } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import requireRole from '../../middleware/role.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.get('/admin-check', authenticate, requireRole('ADMIN'), checkAdmin);

export default router;
