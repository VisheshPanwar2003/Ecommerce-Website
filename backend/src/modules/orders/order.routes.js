import { Router } from 'express';
import {
  createOrder,
  getOrderHistory,
  getOrderById
} from './order.controller.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// All order endpoints require customer authentication
router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrderHistory);
router.get('/:id', getOrderById);

export default router;
