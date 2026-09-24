import { Router } from 'express';
import {
  getInventory,
  getProductInventory,
  createMovement,
  getProductMovements
} from './inventory.controller.js';
import {
  productIdParamSchema,
  createMovementSchema
} from './inventory.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// All inventory endpoints require authentication and either SELLER or ADMIN role.
// CUSTOMER role is blocked with 403 Forbidden.
router.use(authenticate);
router.use(requireRole('SELLER', 'ADMIN'));

// List inventory
router.get('/', getInventory);

// Create inventory movement
router.post('/movements', validate(createMovementSchema), createMovement);

// Movement history for a specific product
router.get('/:productId/movements', validate(productIdParamSchema), getProductMovements);

// Specific product inventory
router.get('/:productId', validate(productIdParamSchema), getProductInventory);

export default router;
