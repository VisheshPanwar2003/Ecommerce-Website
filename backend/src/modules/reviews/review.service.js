import reviewRepository from './review.repository.js';
import AppError from '../../utils/AppError.js';

export class ReviewService {
  /**
   * Get reviews for a product.
   * Product existence check: 404 if not found.
   * Reviews are public — no auth required.
   */
  async getProductReviews(productId) {
    const product = await reviewRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const reviews = await reviewRepository.findByProductId(productId);
    const ratingStats = await reviewRepository.getRatingStats(productId);

    return { reviews, ratingStats };
  }

  /**
   * Create a review for a product.
   *
   * Business rules enforced:
   * 1. Only CUSTOMER role.
   * 2. Product must exist.
   * 3. Product must be ACTIVE.
   * 4. Customer must have purchased the product (Order → OrderItem).
   * 5. Only one review per customer per product (@@unique enforced here and in DB).
   *
   * userId always comes from req.user — never from client body.
   * productId always comes from URL param — never from client body.
   */
  async createReview(userId, productId, { rating, comment }) {
    // 1. Product must exist
    const product = await reviewRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // 2. Product must be ACTIVE for new reviews
    if (product.status !== 'ACTIVE') {
      throw new AppError('Cannot review an inactive product', 400);
    }

    // 3. Verify purchase: User must have ordered this product
    const hasPurchased = await reviewRepository.hasUserPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new AppError(
        'You can only review products you have purchased',
        403
      );
    }

    // 4. Check for duplicate review before writing
    const existingReview = await reviewRepository.findByUserAndProduct(userId, productId);
    if (existingReview) {
      throw new AppError('You have already reviewed this product', 409);
    }

    try {
      const review = await reviewRepository.create({ userId, productId, rating, comment });
      return review;
    } catch (error) {
      // Handle DB-level unique constraint race condition
      if (error.code === 'P2002') {
        throw new AppError('You have already reviewed this product', 409);
      }
      throw error;
    }
  }

  /**
   * Update own review.
   * Ownership enforced server-side.
   */
  async updateReview(reviewId, userId, { rating, comment }) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.userId !== userId) {
      throw new AppError('Forbidden: You can only edit your own reviews', 403);
    }

    const updated = await reviewRepository.update(reviewId, { rating, comment });
    return updated;
  }

  /**
   * Delete own review.
   * Ownership enforced server-side.
   */
  async deleteReview(reviewId, userId) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.userId !== userId) {
      throw new AppError('Forbidden: You can only delete your own reviews', 403);
    }

    await reviewRepository.delete(reviewId);
  }

  /**
   * Get rating aggregation only (for product detail endpoint).
   */
  async getRatingStats(productId) {
    return reviewRepository.getRatingStats(productId);
  }

  /**
   * Check if a customer is eligible to review a product.
   */
  async checkReviewEligibility(userId, productId) {
    const product = await reviewRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const hasPurchased = await reviewRepository.hasUserPurchasedProduct(userId, productId);
    const existingReview = await reviewRepository.findByUserAndProduct(userId, productId);

    return {
      canReview: hasPurchased && !existingReview && product.status === 'ACTIVE',
      hasPurchased,
      hasReviewed: !!existingReview,
      existingReview: existingReview || null
    };
  }
}

export default new ReviewService();
