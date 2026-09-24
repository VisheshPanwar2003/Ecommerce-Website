import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import categoryRoutes from '../modules/categories/categories.routes.js';
import productRoutes from '../modules/products/products.routes.js';
import cartRoutes from '../modules/cart/cart.routes.js';
import wishlistRoutes from '../modules/wishlist/wishlist.routes.js';
import checkoutRoutes from '../modules/checkout/checkout.routes.js';
import orderRoutes from '../modules/orders/order.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import sellerRoutes from '../modules/seller/seller.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import { reviewRouter } from '../modules/reviews/review.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/reviews', reviewRouter);

export default router;
