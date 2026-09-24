import { Router } from 'express';
import {
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant
} from './productVariants.controller.js';
import {
  createVariantSchema,
  updateVariantSchema,
  listVariantsSchema,
  variantParamSchema
} from './productVariants.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router({ mergeParams: true });

// Public read route
router.get('/', validate(listVariantsSchema), getVariants);

// Seller/Admin mutation routes
router.post(
  '/',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(createVariantSchema),
  createVariant
);

router.patch(
  '/:variantId',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(updateVariantSchema),
  updateVariant
);

router.delete(
  '/:variantId',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(variantParamSchema),
  deleteVariant
);

export default router;
