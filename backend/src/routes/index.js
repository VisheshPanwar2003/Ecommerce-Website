import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import categoryRoutes from '../modules/categories/categories.routes.js';
import productRoutes from '../modules/products/products.routes.js';
import cartRoutes from '../modules/cart/cart.routes.js';
import wishlistRoutes from '../modules/wishlist/wishlist.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);

export default router;
