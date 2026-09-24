import orderService from './order.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body || {});

  return res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
});

export const getOrderHistory = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrderHistory(req.user.id);

  return res.status(200).json({
    success: true,
    data: { orders }
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getOrderById(req.user.id, id);

  return res.status(200).json({
    success: true,
    data: { order }
  });
});

export default {
  createOrder,
  getOrderHistory,
  getOrderById
};
