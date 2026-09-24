import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart
} from './cart.controller.js';
import {
  addItemSchema,
  updateItemQuantitySchema,
  itemIdParamSchema
} from './cart.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCart);
router.delete('/', clearCart);

router.post('/items', validate(addItemSchema), addItem);
router.patch('/items/:itemId', validate(updateItemQuantitySchema), updateItemQuantity);
router.delete('/items/:itemId', validate(itemIdParamSchema), removeItem);

export default router;
