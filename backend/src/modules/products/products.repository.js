import prisma from '../../config/prisma.js';

export class ProductsRepository {
  async findAll(filter = {}) {
    return prisma.product.findMany({
      where: filter,
      select: {
        id: true,
        sellerId: true,
        categoryId: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        discount: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        seller: {
          select: {
            id: true,
            storeName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAndCount({ where = {}, orderBy = { createdAt: 'desc' }, skip = 0, take = 20 }) {
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          sellerId: true,
          categoryId: true,
          name: true,
          description: true,
          sku: true,
          price: true,
          discount: true,
          stock: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          seller: {
            select: {
              id: true,
              storeName: true
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
        },
        orderBy,
        skip,
        take
      }),
      prisma.product.count({ where })
    ]);

    return { products, totalItems };
  }

  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        categoryId: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        discount: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        seller: {
          select: {
            id: true,
            storeName: true
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
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });
  }

  async findBySku(sku) {
    return prisma.product.findUnique({
      where: { sku }
    });
  }

  async create(data) {
    return prisma.product.create({
      data,
      select: {
        id: true,
        sellerId: true,
        categoryId: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        discount: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        seller: {
          select: {
            id: true,
            storeName: true
          }
        }
      }
    });
  }

  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      select: {
        id: true,
        sellerId: true,
        categoryId: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        discount: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        seller: {
          select: {
            id: true,
            storeName: true
          }
        }
      }
    });
  }

  async delete(id) {
    return prisma.product.delete({
      where: { id }
    });
  }

  async countOrderItems(productId) {
    return prisma.orderItem.count({
      where: { productId }
    });
  }

  async findSellerByUserId(userId) {
    return prisma.seller.findUnique({
      where: { userId }
    });
  }

  async findSellerById(sellerId) {
    return prisma.seller.findUnique({
      where: { id: sellerId }
    });
  }

  async findCategoryById(categoryId) {
    return prisma.category.findUnique({
      where: { id: categoryId }
    });
  }

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
}

export default new ProductsRepository();
