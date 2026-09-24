import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from './categories.controller.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema
} from './categories.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// Public read routes
router.get('/', getCategories);
router.get('/:id', validate(categoryIdParamSchema), getCategoryById);

// Admin-only mutation routes
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate(createCategorySchema),
  createCategory
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(updateCategorySchema),
  updateCategory
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(categoryIdParamSchema),
  deleteCategory
);

export default router;
