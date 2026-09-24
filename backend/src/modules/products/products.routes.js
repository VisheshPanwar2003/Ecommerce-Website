import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from './products.controller.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema
} from './products.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// Public read routes
router.get('/', getProducts);
router.get('/:id', validate(productIdParamSchema), getProductById);

// Seller/Admin mutation routes
router.post(
  '/',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(createProductSchema),
  createProduct
);

router.patch(
  '/:id',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(updateProductSchema),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(productIdParamSchema),
  deleteProduct
);

export default router;
