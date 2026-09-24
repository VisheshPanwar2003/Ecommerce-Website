import api from './api.js';

export const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data?.data?.wishlist || null;
};

export const addToWishlist = async (productId) => {
  const response = await api.post('/wishlist/items', { productId });
  return response.data?.data?.item || response.data?.data || null;
};

export const removeWishlistItem = async (itemId) => {
  await api.delete(`/wishlist/items/${itemId}`);
  return true;
};

export const clearWishlist = async () => {
  await api.delete('/wishlist');
  return true;
};

export default {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  clearWishlist
};
