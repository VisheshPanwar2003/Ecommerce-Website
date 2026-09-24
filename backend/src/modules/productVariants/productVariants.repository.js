import prisma from '../../config/prisma.js';

export class ProductVariantsRepository {
  async findByProductId(productId) {
    return prisma.productVariant.findMany({
      where: { productId },
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async findById(id) {
    return prisma.productVariant.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async findBySku(sku) {
    return prisma.productVariant.findUnique({
      where: { sku }
    });
  }

  async create(data) {
    return prisma.productVariant.create({
      data,
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async update(id, data) {
    return prisma.productVariant.update({
      where: { id },
      data,
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async delete(id) {
    return prisma.productVariant.delete({
      where: { id }
    });
  }

  async countOrderItems(variantId) {
    return prisma.orderItem.count({
      where: { variantId }
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

export default new ProductVariantsRepository();
