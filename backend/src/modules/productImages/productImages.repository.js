import prisma from '../../config/prisma.js';

export class ProductImagesRepository {
  async findByProductId(productId) {
    return prisma.productImage.findMany({
      where: { productId },
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  }

  async findById(id) {
    return prisma.productImage.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async create(data) {
    return prisma.productImage.create({
      data,
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async update(id, data) {
    return prisma.productImage.update({
      where: { id },
      data,
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async delete(id) {
    return prisma.productImage.delete({
      where: { id }
    });
  }

  async findProductById(productId) {
    return prisma.product.findUnique({
      where: { id: productId }
    });
  }

  async findSellerByUserId(userId) {
    return prisma.seller.findUnique({
      where: { userId }
    });
  }
}

export default new ProductImagesRepository();
