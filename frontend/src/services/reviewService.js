import api from './api.js';

export const getProductReviews = async (productId) => {
  const response = await api.get(`/products/${productId}/reviews`);
  return response.data?.data || { reviews: [], ratingStats: { average: null, count: 0 } };
};

export const checkReviewEligibility = async (productId) => {
  const response = await api.get(`/products/${productId}/reviews/eligibility`);
  return response.data?.data || { canReview: false, hasPurchased: false, hasReviewed: false };
};

export const createReview = async (productId, data) => {
  const response = await api.post(`/products/${productId}/reviews`, data);
  return response.data?.data?.review || response.data?.data;
};

export const updateReview = async (reviewId, data) => {
  const response = await api.patch(`/reviews/${reviewId}`, data);
  return response.data?.data?.review || response.data?.data;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

export default {
  getProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview
};
