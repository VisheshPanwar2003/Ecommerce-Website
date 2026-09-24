import { Router } from 'express';
import {
  getDashboardData,
  getSellerProducts,
  getSellerProductById,
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus
} from './seller.controller.js';
import {
  productIdParamSchema,
  orderIdParamSchema,
  updateOrderStatusSchema
} from './seller.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// Protect all seller routes with authentication and SELLER or ADMIN role
router.use(authenticate);
router.use(requireRole('SELLER', 'ADMIN'));

// Seller dashboard aggregation
router.get('/dashboard', getDashboardData);

// Seller products
router.get('/products', getSellerProducts);
router.get('/products/:id', validate(productIdParamSchema), getSellerProductById);

// Seller orders
router.get('/orders', getSellerOrders);
router.get('/orders/:id', validate(orderIdParamSchema), getSellerOrderById);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), updateSellerOrderStatus);

export default router;
