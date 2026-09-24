import api from './api.js';

export const getSellerDashboard = async (params = {}) => {
  const response = await api.get('/seller/dashboard', { params });
  return response.data?.data || null;
};

export const getSellerProducts = async (params = {}) => {
  const response = await api.get('/seller/products', { params });
  return response.data?.data?.products || [];
};

export const getSellerOrders = async (params = {}) => {
  const response = await api.get('/seller/orders', { params });
  return response.data?.data?.orders || [];
};

export const getSellerInventory = async () => {
  const response = await api.get('/inventory');
  return response.data?.data?.inventory || [];
};

export default {
  getSellerDashboard,
  getSellerProducts,
  getSellerOrders,
  getSellerInventory
};
