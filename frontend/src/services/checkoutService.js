import api from './api.js';

export const getCheckoutSummary = async (couponCode = null) => {
  const params = {};
  if (couponCode) {
    params.couponCode = couponCode;
  }
  const response = await api.get('/checkout/summary', { params });
  return response.data?.data || null;
};

export const createOrder = async (orderData = {}) => {
  const response = await api.post('/orders', orderData);
  return response.data?.data?.order || response.data?.data || null;
};

export default {
  getCheckoutSummary,
  createOrder
};
