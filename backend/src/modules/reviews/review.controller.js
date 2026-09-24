import reviewService from './review.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

/**
 * GET /api/v1/products/:productId/reviews
 * Public — no auth required.
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { reviews, ratingStats } = await reviewService.getProductReviews(productId);

  return res.status(200).json({
    success: true,
    data: {
      reviews,
      ratingStats
    }
  });
});

/**
 * POST /api/v1/products/:productId/reviews
 * Requires authentication as CUSTOMER.
 * userId from req.user — never from body.
 * productId from URL param — never from body.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const review = await reviewService.createReview(req.user.id, productId, { rating, comment });

  return res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: { review }
  });
});

/**
 * PATCH /api/v1/reviews/:reviewId
 * Requires authentication as CUSTOMER.
 * Ownership enforced in service.
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await reviewService.updateReview(reviewId, req.user.id, { rating, comment });

  return res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: { review }
  });
});

/**
 * DELETE /api/v1/reviews/:reviewId
 * Requires authentication as CUSTOMER.
 * Ownership enforced in service.
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  await reviewService.deleteReview(reviewId, req.user.id);

  return res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

/**
 * GET /api/v1/products/:productId/reviews/eligibility
 * Requires authentication as CUSTOMER.
 */
export const checkReviewEligibility = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const eligibility = await reviewService.checkReviewEligibility(req.user.id, productId);

  return res.status(200).json({
    success: true,
    data: eligibility
  });
});

export default {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  checkReviewEligibility
};
