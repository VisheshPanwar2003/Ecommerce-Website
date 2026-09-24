import { Router } from 'express';
import {
  getDashboard,
  getUsers,
  updateUserStatus,
  getSellers,
  updateSellerStatus,
  getProducts,
  updateProductStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrderById
} from './admin.controller.js';
import {
  uuidParamSchema,
  updateUserStatusSchema,
  updateSellerStatusSchema,
  updateProductStatusSchema
} from './admin.validation.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema
} from '../categories/categories.validation.js';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../coupons/coupon.controller.js';
import {
  createCouponSchema,
  updateCouponSchema
} from '../coupons/coupon.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// Protect all admin routes: Authentication + ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

// Platform Dashboard
router.get('/dashboard', getDashboard);

// User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', validate(updateUserStatusSchema), updateUserStatus);

// Seller Moderation
router.get('/sellers', getSellers);
router.patch('/sellers/:id/status', validate(updateSellerStatusSchema), updateSellerStatus);

// Product Moderation
router.get('/products', getProducts);
router.patch('/products/:id/status', validate(updateProductStatusSchema), updateProductStatus);

// Category Management
router.get('/categories', getCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.patch('/categories/:id', validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', validate(categoryIdParamSchema), deleteCategory);

// Order Overview
router.get('/orders', getOrders);
router.get('/orders/:id', validate(uuidParamSchema), getOrderById);

// Platform Coupons Management (Admin only)
router.get('/coupons', getCoupons);
router.post('/coupons', validate(createCouponSchema), createCoupon);
router.patch('/coupons/:id', validate(updateCouponSchema), updateCoupon);
router.delete('/coupons/:id', validate(uuidParamSchema), deleteCoupon);

export default router;
