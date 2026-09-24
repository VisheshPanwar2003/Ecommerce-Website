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

  /**
   * Find a single product with category, variants, and images
   */
  async findProductById(productId) {
    return prisma.product.findUnique({
      where: { id: productId },
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
            altText: true,
            displayOrder: true
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
  }
  /**
   * Find orders containing items belonging to a seller (scoped to prevent cross-vendor leakage)
   */
  async findSellerOrders(sellerId) {
    return prisma.order.findMany({
      where: {
        items: {
          some: { sellerId }
        }
      },
      include: {
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            variantId: true,
            sellerId: true,
            productName: true,
            sku: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            total: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find single order with all its items for multi-vendor and ownership verification
   */
  async findOrderWithAllItems(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            id: true,
            orderId: true,
            productId: true,
            variantId: true,
            sellerId: true,
            productName: true,
            sku: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            total: true,
            createdAt: true
          }
        }
      }
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, tx = prisma) {
    return tx.order.update({
      where: { id: orderId },
      data: { orderStatus: status }
    });
  }

  /**
   * Cancel order and restore inventory atomically using InventoryMovementType.CANCELLATION
   */
  async cancelOrderWithInventoryRestoration(order) {
    return prisma.$transaction(async (tx) => {
      // 1. Restore stock for each item in the order
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity }
            }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity }
            }
          });
        }

        // Record auditable CANCELLATION inventory movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            type: 'CANCELLATION',
            quantityChange: item.quantity,
            reference: `Cancellation for Order ${order.id}`
          }
        });
      }

      // 2. Mark order as CANCELLED
      return tx.order.update({
        where: { id: order.id },
        data: { orderStatus: 'CANCELLED' }
      });
    });
  }
}

export default new SellerRepository();
