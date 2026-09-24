import api from './api.js';

export const getProducts = async (params = {}) => {
  const cleanParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleanParams[key] = value;
    }
  });

  const response = await api.get('/products', { params: cleanParams });
  return response.data?.data || { products: [], pagination: {} };
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data?.data?.product || null;
};

export default {
  getProducts,
  getProductById
};
