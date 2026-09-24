import prisma from '../../config/prisma.js';

export class InventoryRepository {
  /**
   * Find products with variants and seller info for inventory listing
   */
  async findProductsInventory(where = {}) {
    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        status: true,
        sellerId: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            storeName: true
          }
        },
        variants: {
          select: {
            id: true,
            productId: true,
            sku: true,
            name: true,
            stock: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find a single product with variants and seller info
   */
  async findProductWithVariantsAndSeller(productId) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        status: true,
        sellerId: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            storeName: true
          }
        },
        variants: {
          select: {
            id: true,
            productId: true,
            sku: true,
            name: true,
            stock: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Find seller record by user ID
   */
  async findSellerByUserId(userId) {
    return prisma.seller.findUnique({
      where: { userId }
    });
  }

  /**
   * Find variant by ID
   */
  async findVariantById(variantId) {
    return prisma.productVariant.findUnique({
      where: { id: variantId }
    });
  }

  /**
   * Apply stock update and create InventoryMovement atomically
   */
  async applyInventoryMovement({
    isVariant,
    targetId,
    productId,
    variantId,
    newStock,
    delta,
    type,
    reason
  }) {
    return prisma.$transaction(async (tx) => {
      let updatedStock;

      if (isVariant) {
        const updatedVariant = await tx.productVariant.update({
          where: { id: targetId },
          data: { stock: newStock }
        });
        updatedStock = updatedVariant.stock;
      } else {
        const updatedProduct = await tx.product.update({
          where: { id: targetId },
          data: { stock: newStock }
        });
        updatedStock = updatedProduct.stock;
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          variantId: variantId || null,
          type,
          quantityChange: delta,
          reference: reason
        }
      });

      return { movement, updatedStock };
    });
  }

  /**
   * Find movement history for a product ordered newest first
   */
  async findMovementsByProductId(productId) {
    return prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        variant: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });
  }
}

export default new InventoryRepository();
