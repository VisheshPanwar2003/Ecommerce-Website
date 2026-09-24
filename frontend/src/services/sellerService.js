import api from './api.js';

export const getSellerDashboard = async (params = {}) => {
  const response = await api.get('/seller/dashboard', { params });
  return response.data?.data || null;
};

export const getSellerProducts = async (params = {}) => {
  const response = await api.get('/seller/products', { params });
  return response.data?.data?.products || [];
};

export const getSellerProduct = async (id) => {
  const response = await api.get(`/seller/products/${id}`);
  return response.data?.data?.product || null;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data?.data?.product || null;
};

export const updateProduct = async (id, productData) => {
  const response = await api.patch(`/products/${id}`, productData);
  return response.data?.data?.product || null;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};

export const createVariant = async (productId, variantData) => {
  const response = await api.post(`/products/${productId}/variants`, variantData);
  return response.data?.data?.variant || null;
};

export const updateVariant = async (productId, variantId, variantData) => {
  const response = await api.patch(`/products/${productId}/variants/${variantId}`, variantData);
  return response.data?.data?.variant || null;
};

export const deleteVariant = async (productId, variantId) => {
  await api.delete(`/products/${productId}/variants/${variantId}`);
};

export const createProductImage = async (productId, imageData) => {
  const response = await api.post(`/products/${productId}/images`, imageData);
  return response.data?.data?.image || null;
};

export const deleteProductImage = async (productId, imageId) => {
  await api.delete(`/products/${productId}/images/${imageId}`);
};

export const getSellerOrders = async (params = {}) => {
  const response = await api.get('/seller/orders', { params });
  return response.data?.data?.orders || [];
};

export const getSellerOrder = async (id) => {
  const response = await api.get(`/seller/orders/${id}`);
  return response.data?.data?.order || null;
};

export const updateSellerOrderStatus = async (id, status) => {
  const response = await api.patch(`/seller/orders/${id}/status`, { status });
  return response.data?.data?.order || null;
};

export const getSellerInventory = async () => {
  const response = await api.get('/inventory');
  return response.data?.data?.inventory || [];
};

export const createInventoryMovement = async (movementData) => {
  const response = await api.post('/inventory/movements', movementData);
  return response.data?.data || null;
};

export default {
  getSellerDashboard,
  getSellerProducts,
  getSellerProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createProductImage,
  deleteProductImage,
  getSellerOrders,
  getSellerOrder,
  updateSellerOrderStatus,
  getSellerInventory,
  createInventoryMovement
};
