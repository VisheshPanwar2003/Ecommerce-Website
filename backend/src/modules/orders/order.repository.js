import prisma from '../../config/prisma.js';

export class OrderRepository {
  async findCartForOrder(userId) {
    return prisma.cart.findUnique({
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

  async findUserAddress(userId, addressId = null) {
    if (addressId) {
      return prisma.address.findFirst({
        where: { id: addressId, userId }
      });
    }
    // Try finding default address, then any user address
    const defaultAddress = await prisma.address.findFirst({
      where: { userId, isDefault: true }
    });
    if (defaultAddress) return defaultAddress;

    return prisma.address.findFirst({
      where: { userId }
    });
  }

  async findUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true }
    });
  }

  async createOrderWithItemsAndClearCart({ orderData, orderItemsData, cartId }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Order with nested OrderItems (saving purchase-time snapshots)
      const order = await tx.order.create({
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

      // 2. Clear customer's cart
      await tx.cartItem.deleteMany({
        where: { cartId }
      });

      return order;
    });
  }

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
