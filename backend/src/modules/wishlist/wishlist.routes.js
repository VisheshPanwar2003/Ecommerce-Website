import { Router } from 'express';
import {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist
} from './wishlist.controller.js';
import {
  addItemSchema,
  itemIdParamSchema
} from './wishlist.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// All wishlist routes require authentication
router.use(authenticate);

router.get('/', getWishlist);
router.delete('/', clearWishlist);

router.post('/items', validate(addItemSchema), addItem);
router.delete('/items/:itemId', validate(itemIdParamSchema), removeItem);

export default router;
