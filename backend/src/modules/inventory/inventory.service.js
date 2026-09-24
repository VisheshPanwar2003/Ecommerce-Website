import inventoryRepository from './inventory.repository.js';
import AppError from '../../utils/AppError.js';

export class InventoryService {
  /**
   * Resolve seller profile and ensure active status
   */
  async resolveSeller(userId) {
    const seller = await inventoryRepository.findSellerByUserId(userId);
    if (!seller) {
      throw new AppError('Seller profile not found. Please register as a seller first.', 400);
    }
    if (seller.status === 'SUSPENDED') {
      throw new AppError('Seller account is suspended', 403);
    }
    return seller;
  }

  /**
   * Verify seller ownership or admin access
   */
  async verifyProductAccess(user, product) {
    if (user.role === 'ADMIN') {
      return true;
    }

    if (user.role === 'SELLER') {
      const seller = await this.resolveSeller(user.id);
      if (product.sellerId !== seller.id) {
        throw new AppError('Forbidden: You do not have permission to manage this product inventory', 403);
      }
      return true;
    }

    throw new AppError('Forbidden: Insufficient privileges', 403);
  }

  /**
   * Get inventory list based on authenticated user role
   */
  async getInventory(user) {
    let where = {};

    if (user.role === 'SELLER') {
      const seller = await this.resolveSeller(user.id);
      where.sellerId = seller.id;
    } else if (user.role !== 'ADMIN') {
      throw new AppError('Forbidden: Insufficient privileges', 403);
    }

    const products = await inventoryRepository.findProductsInventory(where);

    const items = [];
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          items.push({
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            productStatus: p.status,
            hasVariants: true,
            variantId: v.id,
            variantName: v.name,
            variantSku: v.sku,
            variantStatus: v.isActive ? 'ACTIVE' : 'INACTIVE',
            currentStock: v.stock,
            seller: {
              id: p.seller?.id || p.sellerId,
              storeName: p.seller?.storeName || null
            }
          });
        }
      } else {
        items.push({
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          productStatus: p.status,
          hasVariants: false,
          variantId: null,
          variantName: null,
          variantSku: null,
          variantStatus: null,
          currentStock: p.stock,
          seller: {
            id: p.seller?.id || p.sellerId,
            storeName: p.seller?.storeName || null
          }
        });
      }
    }

    return items;
  }

  /**
   * Get product inventory state
   */
  async getProductInventory(user, productId) {
    const product = await inventoryRepository.findProductWithVariantsAndSeller(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await this.verifyProductAccess(user, product);

    const hasVariants = Boolean(product.variants && product.variants.length > 0);

    if (hasVariants) {
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productStatus: product.status,
        hasVariants: true,
        variants: product.variants.map((v) => ({
          variantId: v.id,
          name: v.name,
          sku: v.sku,
          stock: v.stock,
          isActive: v.isActive
        })),
        seller: {
          id: product.seller.id,
          storeName: product.seller.storeName
        }
      };
    }

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      productStatus: product.status,
      hasVariants: false,
      stock: product.stock,
      seller: {
        id: product.seller.id,
        storeName: product.seller.storeName
      }
    };
  }

  /**
   * Create inventory movement (RESTOCK, ADJUSTMENT, RETURN)
   */
  async createMovement(user, { productId, variantId, type, quantity, reason }) {
    if (type === 'SALE' || type === 'CANCELLATION') {
      throw new AppError('Movement types SALE and CANCELLATION are reserved for automated order processing in Task 20', 400);
    }

    if (!['RESTOCK', 'ADJUSTMENT', 'RETURN'].includes(type)) {
      throw new AppError('Invalid movement type', 400);
    }

    if (!reason || !reason.trim()) {
      throw new AppError('Reason is required for inventory movements', 400);
    }

    const product = await inventoryRepository.findProductWithVariantsAndSeller(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await this.verifyProductAccess(user, product);

    const hasVariants = Boolean(product.variants && product.variants.length > 0);

    let targetVariant = null;
    if (hasVariants) {
      if (!variantId) {
        throw new AppError('Product has variants. Please specify a valid variantId', 400);
      }

      targetVariant = product.variants.find((v) => v.id === variantId);
      if (!targetVariant) {
        const existingVariant = await inventoryRepository.findVariantById(variantId);
        if (existingVariant) {
          throw new AppError('Variant does not belong to the specified product', 400);
        }
        throw new AppError('Variant not found', 404);
      }
    } else {
      if (variantId) {
        throw new AppError('Product does not have variants. variantId cannot be specified', 400);
      }
    }

    // Determine current stock from source of truth
    const currentStock = hasVariants ? targetVariant.stock : product.stock;

    // Calculate signed delta
    let delta;
    if (type === 'RESTOCK' || type === 'RETURN') {
      if (quantity <= 0) {
        throw new AppError(`Quantity for ${type} must be a positive integer`, 400);
      }
      delta = quantity;
    } else if (type === 'ADJUSTMENT') {
      if (quantity === 0) {
        throw new AppError('Quantity for ADJUSTMENT cannot be zero', 400);
      }
      delta = quantity;
    }

    const newStock = currentStock + delta;
    if (newStock < 0) {
      throw new AppError(`Insufficient stock: Operation would result in negative stock (${newStock})`, 400);
    }

    const { movement, updatedStock } = await inventoryRepository.applyInventoryMovement({
      isVariant: hasVariants,
      targetId: hasVariants ? variantId : productId,
      productId,
      variantId: variantId || null,
      newStock,
      delta,
      type,
      reason: reason.trim()
    });

    return {
      movement: {
        id: movement.id,
        productId: movement.productId,
        variantId: movement.variantId,
        type: movement.type,
        quantity: movement.quantityChange,
        quantityChange: movement.quantityChange,
        reason: movement.reference,
        reference: movement.reference,
        createdAt: movement.createdAt
      },
      inventory: {
        productId,
        variantId: variantId || null,
        previousStock: currentStock,
        currentStock: updatedStock,
        newStock: updatedStock
      }
    };
  }

  /**
   * Get movement history for a product
   */
  async getProductMovements(user, productId) {
    const product = await inventoryRepository.findProductWithVariantsAndSeller(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await this.verifyProductAccess(user, product);

    const movements = await inventoryRepository.findMovementsByProductId(productId);

    return movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      variantId: m.variantId,
      type: m.type,
      quantity: m.quantityChange,
      quantityChange: m.quantityChange,
      reason: m.reference,
      reference: m.reference,
      createdAt: m.createdAt,
      variant: m.variant
        ? {
            id: m.variant.id,
            name: m.variant.name,
            sku: m.variant.sku
          }
        : null
    }));
  }
}

export default new InventoryService();
