import prisma from '../../config/prisma.js';

export class CartRepository {
  async findCartByUserId(userId) {
    return prisma.cart.findUnique({
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

  async createCart(userId) {
    return prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    });
  }

  async findCartItem(cartId, productId, variantId = null) {
    return prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId || null
      }
    });
  }

  async findCartItemById(itemId) {
    return prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: {
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
      }
    });
  }

  async createCartItem(data) {
    return prisma.cartItem.create({
      data
    });
  }

  async updateCartItemQuantity(itemId, quantity) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  }

  async deleteCartItem(itemId) {
    return prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  async clearCartItems(cartId) {
    return prisma.cartItem.deleteMany({
      where: { cartId }
    });
  }

  async findProductForCart(productId) {
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

  async findVariantForCart(variantId) {
    return prisma.productVariant.findUnique({
      where: { id: variantId }
    });
  }
}

export default new CartRepository();
