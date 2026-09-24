import { Router } from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  checkReviewEligibility
} from './review.controller.js';
import {
  productIdParamSchema,
  reviewIdParamSchema,
  createReviewSchema,
  updateReviewSchema
} from './review.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

// ─── Product-scoped review routes ─────────────────────────────────────────────
// Mounted at /products/:productId/reviews by products.routes.js

export const productReviewRouter = Router({ mergeParams: true });

// Public: list reviews for a product
productReviewRouter.get(
  '/',
  validate(productIdParamSchema),
  getProductReviews
);

// Authenticated CUSTOMER only: check review eligibility
productReviewRouter.get(
  '/eligibility',
  authenticate,
  requireRole('CUSTOMER'),
  validate(productIdParamSchema),
  checkReviewEligibility
);

// Authenticated CUSTOMER only: create a review
productReviewRouter.post(
  '/',
  authenticate,
  requireRole('CUSTOMER'),
  validate(createReviewSchema),
  createReview
);

// ─── Standalone review routes ─────────────────────────────────────────────────
// Mounted at /reviews by routes/index.js

export const reviewRouter = Router();

// Authenticated CUSTOMER only: update own review
reviewRouter.patch(
  '/:reviewId',
  authenticate,
  requireRole('CUSTOMER'),
  validate(updateReviewSchema),
  updateReview
);

// Authenticated CUSTOMER only: delete own review
reviewRouter.delete(
  '/:reviewId',
  authenticate,
  requireRole('CUSTOMER'),
  validate(reviewIdParamSchema),
  deleteReview
);

export default { productReviewRouter, reviewRouter };
