import prisma from '../../config/prisma.js';

export class ReviewRepository {
  /**
   * List reviews for a product, newest first.
   * Safe projection: no passwordHash, no authentication secrets.
   */
  async findByProductId(productId) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: {
        id: true,
        userId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reviews.map((r) => ({
      ...r,
      verifiedPurchase: true
    }));
  }

  /**
   * Find single review by ID with owner info for ownership checks.
   */
  async findById(id) {
    return prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        productId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true }
        }
      }
    });
  }

  /**
   * Find a user's existing review for a product (for duplicate detection).
   */
  async findByUserAndProduct(userId, productId) {
    return prisma.review.findUnique({
      where: { userId_productId: { userId, productId } }
    });
  }

  /**
   * Check whether a customer has an OrderItem for this product
   * (purchase verification). Uses an efficient existence query.
   *
   * Traversal: User → Order → OrderItem → Product
   */
  async hasUserPurchasedProduct(userId, productId) {
    const item = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId
        }
      },
      select: { id: true }
    });
    return item !== null;
  }

  /**
   * Create a new review. userId and productId come from server-side context,
   * never from client body.
   */
  async create({ userId, productId, rating, comment }) {
    const review = await prisma.review.create({
      data: { userId, productId, rating, comment },
      select: {
        id: true,
        userId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true }
        }
      }
    });
    return { ...review, verifiedPurchase: true };
  }

  /**
   * Update a review's mutable fields (rating, comment).
   * Ownership must be verified before calling this.
   */
  async update(id, { rating, comment }) {
    const data = {};
    if (rating !== undefined) data.rating = rating;
    if (comment !== undefined) data.comment = comment;

    const review = await prisma.review.update({
      where: { id },
      data,
      select: {
        id: true,
        userId: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true }
        }
      }
    });
    return { ...review, verifiedPurchase: true };
  }

  /**
   * Delete a review. Ownership must be verified before calling this.
   */
  async delete(id) {
    return prisma.review.delete({ where: { id } });
  }

  /**
   * Aggregate rating statistics for a product.
   * Returns { average: number|null, count: number }.
   */
  async getRatingStats(productId) {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return {
      average: result._avg.rating !== null ? Math.round(result._avg.rating * 10) / 10 : null,
      count: result._count.rating
    };
  }

  /**
   * Check if product exists (used for 404 guard).
   */
  async findProductById(productId) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true }
    });
  }
}

export default new ReviewRepository();
