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
  productIdParamSchema,
  listProductsQuerySchema
} from './products.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import variantRoutes from '../productVariants/productVariants.routes.js';
import imageRoutes from '../productImages/productImages.routes.js';
import { productReviewRouter } from '../reviews/review.routes.js';

const router = Router();

// Nested sub-resource routes
router.use('/:productId/variants', variantRoutes);
router.use('/:productId/images', imageRoutes);
router.use('/:productId/reviews', productReviewRouter);

// Public read routes
router.get('/', validate(listProductsQuerySchema), getProducts);
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
