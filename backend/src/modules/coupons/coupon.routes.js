import { Router } from 'express';
import { validateCoupon } from './coupon.controller.js';
import { validateCouponSchema } from './coupon.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// Customer coupon validation endpoint (requires authentication)
router.post('/validate', authenticate, validate(validateCouponSchema), validateCoupon);

export default router;
