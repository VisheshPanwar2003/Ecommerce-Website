import api from './api.js';

export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data?.data?.cart || null;
};

export const addToCart = async (productId, variantId = null, quantity = 1) => {
  const payload = {
    productId,
    quantity: Math.max(1, parseInt(quantity, 10) || 1)
  };
  if (variantId) {
    payload.variantId = variantId;
  }

  const response = await api.post('/cart/items', payload);
  return response.data?.data?.cart || response.data?.data || null;
};

export default {
  getCart,
  addToCart
};
