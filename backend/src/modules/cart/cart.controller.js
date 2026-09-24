import cartService from './cart.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);

  return res.status(200).json({
    success: true,
    data: { cart }
  });
});

export const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: { cart }
  });
});

export const updateItemQuantity = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const cart = await cartService.updateItemQuantity(req.user.id, itemId, quantity);

  return res.status(200).json({
    success: true,
    message: 'Cart item quantity updated',
    data: { cart }
  });
});

export const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  await cartService.removeItem(req.user.id, itemId);

  return res.status(204).send();
});

export const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.id);

  return res.status(204).send();
});

export default {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart
};
