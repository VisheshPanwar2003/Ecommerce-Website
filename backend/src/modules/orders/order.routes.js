import { Router } from 'express';
import {
  createOrder,
  getOrderHistory,
  getOrderById
} from './order.controller.js';
import {
  createOrderSchema,
  orderIdParamSchema
} from './order.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// All order endpoints require customer authentication
router.use(authenticate);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getOrderHistory);
router.get('/:id', validate(orderIdParamSchema), getOrderById);

export default router;
