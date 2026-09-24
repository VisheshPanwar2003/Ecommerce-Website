import prisma from '../../config/prisma.js';

export class CheckoutRepository {
  async findCartForCheckout(userId) {
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
                },
                images: {
                  select: {
                    id: true,
                    url: true,
                    altText: true,
                    displayOrder: true
                  },
                  orderBy: [
                    { displayOrder: 'asc' },
                    { createdAt: 'asc' }
                  ],
                  take: 1
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
}

export default new CheckoutRepository();
