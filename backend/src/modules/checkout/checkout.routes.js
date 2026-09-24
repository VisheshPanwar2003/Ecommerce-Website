import { Router } from 'express';
import { getCheckoutSummary } from './checkout.controller.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// Authentication is mandatory for checkout
router.use(authenticate);

router.get('/summary', getCheckoutSummary);

export default router;
