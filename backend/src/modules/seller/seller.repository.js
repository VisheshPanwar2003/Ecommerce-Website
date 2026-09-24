import prisma from '../../config/prisma.js';

export class SellerRepository {
  /**
   * Find seller profile associated with a user ID
   */
  async findSellerByUserId(userId) {
    return prisma.seller.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Find seller profile by seller ID
   */
  async findSellerById(id) {
    return prisma.seller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Find first seller profile (fallback for admin view)
   */
  async findFirstSeller() {
    return prisma.seller.findFirst({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Find all products belonging to a seller with variants and category
   */
  async findSellerProducts(sellerId) {
    return prisma.product.findMany({
      where: { sellerId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock: true,
            isActive: true
          },
          orderBy: { createdAt: 'asc' }
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true
          },
          orderBy: { displayOrder: 'asc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find order items belonging to a seller (scoped to prevent cross-vendor leakage)
   */
  async findSellerOrderItems(sellerId, limit = 50) {
    return prisma.orderItem.findMany({
      where: { sellerId },
      include: {
        order: {
          select: {
            id: true,
            orderStatus: true,
            paymentStatus: true,
            createdAt: true,
            shippingCity: true,
            shippingState: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

export default new SellerRepository();
