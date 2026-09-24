import api from './api.js';

export const getCategories = async () => {
  const response = await api.get('/categories');
  const categories = response.data?.data?.categories || [];
  return categories.filter((c) => c.isActive !== false);
};

export default {
  getCategories
};
