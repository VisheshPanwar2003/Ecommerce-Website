import wishlistService from './wishlist.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);

  return res.status(200).json({
    success: true,
    data: { wishlist }
  });
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const { item, isNew } = await wishlistService.addItem(req.user.id, productId);

  return res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Product added to wishlist' : 'Product already in wishlist',
    data: { item }
  });
});

export const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  await wishlistService.removeItem(req.user.id, itemId);

  return res.status(204).send();
});

export const clearWishlist = asyncHandler(async (req, res) => {
  await wishlistService.clearWishlist(req.user.id);

  return res.status(204).send();
});

export default {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist
};
