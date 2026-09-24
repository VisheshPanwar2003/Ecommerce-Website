import prisma from '../../config/prisma.js';

export class WishlistRepository {
  async findWishlistByUserId(userId) {
    return prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                discount: true,
                stock: true,
                status: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true
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
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async createWishlist(userId) {
    return prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async findWishlistItem(wishlistId, productId) {
    return prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            discount: true,
            stock: true,
            status: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true
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
        }
      }
    });
  }

  async findWishlistItemById(itemId) {
    return prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: {
            id: true,
            userId: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            discount: true,
            stock: true,
            status: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true
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
        }
      }
    });
  }

  async createWishlistItem(data) {
    return prisma.wishlistItem.create({
      data,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            discount: true,
            stock: true,
            status: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true
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
        }
      }
    });
  }

  async deleteWishlistItem(itemId) {
    return prisma.wishlistItem.delete({
      where: { id: itemId }
    });
  }

  async clearWishlistItems(wishlistId) {
    return prisma.wishlistItem.deleteMany({
      where: { wishlistId }
    });
  }

  async findProductForWishlist(productId) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });
  }
}

export default new WishlistRepository();
