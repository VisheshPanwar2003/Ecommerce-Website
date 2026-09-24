import prisma from '../../config/prisma.js';

export class OrderRepository {
  /**
   * Find user's cart including product, category, seller, and variant details
   */
  async findCartForOrder(userId, tx = prisma) {
    return tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true
                  }
                },
                seller: {
                  select: {
                    id: true,
                    storeName: true,
                    status: true
                  }
                }
              }
            },
            variant: {
              select: {
                id: true,
                productId: true,
                name: true,
                sku: true,
                price: true,
                stock: true,
                isActive: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Find user's shipping address
   */
  async findUserAddress(userId, addressId = null, tx = prisma) {
    if (addressId) {
      return tx.address.findFirst({
        where: { id: addressId, userId }
      });
    }
    const defaultAddress = await tx.address.findFirst({
      where: { userId, isDefault: true }
    });
    if (defaultAddress) return defaultAddress;

    return tx.address.findFirst({
      where: { userId }
    });
  }

  /**
   * Find user by ID for profile fallback
   */
  async findUserById(userId, tx = prisma) {
    return tx.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true }
    });
  }

  /**
   * Execute an atomic conditional stock deduction for non-variant products:
   * UPDATE Product SET stock = stock - quantity WHERE id = productId AND stock >= quantity
   * Returns true if affected rows === 1, false if 0.
   */
  async deductProductStock(tx, productId, quantity) {
    const result = await tx.product.updateMany({
      where: {
        id: productId,
        stock: { gte: quantity }
      },
      data: {
        stock: { decrement: quantity }
      }
    });
    return result.count === 1;
  }

  /**
   * Execute an atomic conditional stock deduction for product variants:
   * UPDATE ProductVariant SET stock = stock - quantity WHERE id = variantId AND stock >= quantity
   * Returns true if affected rows === 1, false if 0.
   */
  async deductVariantStock(tx, variantId, quantity) {
    const result = await tx.productVariant.updateMany({
      where: {
        id: variantId,
        stock: { gte: quantity }
      },
      data: {
        stock: { decrement: quantity }
      }
    });
    return result.count === 1;
  }

  /**
   * Create Order with nested OrderItems inside transaction
   */
  async createOrderWithItems(tx, orderData, orderItemsData) {
    return tx.order.create({
      data: {
        ...orderData,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: {
          include: {
            seller: {
              select: {
                id: true,
                storeName: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create an InventoryMovement record with type SALE inside transaction
   */
  async createSaleInventoryMovement(tx, { productId, variantId, quantity, orderId }) {
    return tx.inventoryMovement.create({
      data: {
        productId,
        variantId: variantId || null,
        type: 'SALE',
        quantityChange: -quantity,
        reference: `Order ${orderId}`
      }
    });
  }

  /**
   * Clear all items in customer's cart inside transaction
   */
  async clearCartItems(tx, cartId) {
    return tx.cartItem.deleteMany({
      where: { cartId }
    });
  }

  /**
   * Execute callback within a Prisma transaction
   */
  async executeInTransaction(callback) {
    return prisma.$transaction(async (tx) => {
      return await callback(tx);
    });
  }

  /**
   * Query orders for order history
   */
  async findOrdersByUserId(userId) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            seller: {
              select: {
                id: true,
                storeName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Query a single order by ID
   */
  async findOrderById(orderId) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            seller: {
              select: {
                id: true,
                storeName: true
              }
            }
          }
        }
      }
    });
  }
}

export default new OrderRepository();
