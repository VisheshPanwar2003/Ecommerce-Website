import api from './api.js';

export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data?.data || null;
};

export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data?.data?.users || [];
};

export const updateUserStatus = async (id, status) => {
  const response = await api.patch(`/admin/users/${id}/status`, { status });
  return response.data?.data?.user || null;
};

export const getAdminSellers = async (params = {}) => {
  const response = await api.get('/admin/sellers', { params });
  return response.data?.data?.sellers || [];
};

export const updateSellerStatus = async (id, status) => {
  const response = await api.patch(`/admin/sellers/${id}/status`, { status });
  return response.data?.data?.seller || null;
};

export const getAdminProducts = async (params = {}) => {
  const response = await api.get('/admin/products', { params });
  return response.data?.data?.products || [];
};

export const updateProductStatus = async (id, status) => {
  const response = await api.patch(`/admin/products/${id}/status`, { status });
  return response.data?.data?.product || null;
};

export const getAdminCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data?.data?.categories || [];
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/admin/categories', categoryData);
  return response.data?.data?.category || null;
};

export const updateCategory = async (id, categoryData) => {
  const response = await api.patch(`/admin/categories/${id}`, categoryData);
  return response.data?.data?.category || null;
};

export const deleteCategory = async (id) => {
  await api.delete(`/admin/categories/${id}`);
};

export const getAdminOrders = async (params = {}) => {
  const response = await api.get('/admin/orders', { params });
  return response.data?.data?.orders || [];
};

export const getAdminOrder = async (id) => {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data?.data?.order || null;
};

export const getAdminCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data?.data?.coupons || [];
};

export const createAdminCoupon = async (data) => {
  const response = await api.post('/admin/coupons', data);
  return response.data?.data?.coupon || response.data?.data;
};

export const updateAdminCoupon = async (id, data) => {
  const response = await api.patch(`/admin/coupons/${id}`, data);
  return response.data?.data?.coupon || response.data?.data;
};

export const deleteAdminCoupon = async (id) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

export default {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminSellers,
  updateSellerStatus,
  getAdminProducts,
  updateProductStatus,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminOrders,
  getAdminOrder,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon
};
