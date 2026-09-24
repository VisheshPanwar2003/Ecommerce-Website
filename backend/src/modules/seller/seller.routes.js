import { Router } from 'express';
import {
  getDashboardData,
  getSellerProducts,
  getSellerOrders
} from './seller.controller.js';
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

// Seller orders
router.get('/orders', getSellerOrders);

export default router;
