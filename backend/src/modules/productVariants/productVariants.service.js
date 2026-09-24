import productVariantsRepository from './productVariants.repository.js';
import AppError from '../../utils/AppError.js';

export class ProductVariantsService {
  async verifyProductOwnership(productId, user) {
    const product = await productVariantsRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (user.role === 'SELLER') {
      const seller = await productVariantsRepository.findSellerByUserId(user.id);
      if (!seller || product.sellerId !== seller.id) {
        throw new AppError('Forbidden: You do not have permission to manage variants for this product', 403);
      }
    } else if (user.role !== 'ADMIN') {
      throw new AppError('Forbidden: Insufficient privileges', 403);
    }

    return product;
  }

  async getVariantsByProductId(productId) {
    const product = await productVariantsRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return productVariantsRepository.findByProductId(productId);
  }

  async createVariant(productId, user, variantData) {
    const product = await this.verifyProductOwnership(productId, user);

    let finalSku;
    if (variantData.sku) {
      finalSku = variantData.sku.trim().toUpperCase();
      const existing = await productVariantsRepository.findBySku(finalSku);
      if (existing) {
        throw new AppError('Variant with this SKU already exists', 409);
      }
    } else {
      const prefix = variantData.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'VAR';
      const timestamp = Date.now().toString(36).toUpperCase();
      finalSku = `${product.sku}-${prefix}-${timestamp}`;
    }

    try {
      return await productVariantsRepository.create({
        productId,
        name: variantData.name.trim(),
        sku: finalSku,
        price: variantData.price !== undefined ? variantData.price : null,
        stock: variantData.stock !== undefined ? variantData.stock : 0,
        isActive: variantData.isActive !== undefined ? variantData.isActive : true
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new AppError('Variant with this SKU already exists', 409);
      }
      throw error;
    }
  }

  async updateVariant(productId, variantId, user, updateData) {
    await this.verifyProductOwnership(productId, user);

    const variant = await productVariantsRepository.findById(variantId);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    // Nested resource validation: Variant must belong to specified product
    if (variant.productId !== productId) {
      throw new AppError('Variant does not belong to the specified product', 404);
    }

    if (updateData.sku) {
      const trimmedSku = updateData.sku.trim().toUpperCase();
      if (trimmedSku !== variant.sku) {
        const existing = await productVariantsRepository.findBySku(trimmedSku);
        if (existing && existing.id !== variantId) {
          throw new AppError('Variant with this SKU already exists', 409);
        }
      }
    }

    const payload = {};
    if (updateData.name !== undefined) payload.name = updateData.name.trim();
    if (updateData.sku !== undefined) payload.sku = updateData.sku.trim().toUpperCase();
    if (updateData.price !== undefined) payload.price = updateData.price;
    if (updateData.stock !== undefined) payload.stock = updateData.stock;
    if (updateData.isActive !== undefined) payload.isActive = updateData.isActive;

    try {
      return await productVariantsRepository.update(variantId, payload);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new AppError('Variant with this SKU already exists', 409);
      }
      throw error;
    }
  }

  async deleteVariant(productId, variantId, user) {
    await this.verifyProductOwnership(productId, user);

    const variant = await productVariantsRepository.findById(variantId);
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }

    // Nested resource validation
    if (variant.productId !== productId) {
      throw new AppError('Variant does not belong to the specified product', 404);
    }

    const orderItemCount = await productVariantsRepository.countOrderItems(variantId);
    if (orderItemCount > 0) {
      throw new AppError('Cannot delete variant with existing order history', 400);
    }

    try {
      await productVariantsRepository.delete(variantId);
    } catch (error) {
      if (error.code === 'P2003') {
        throw new AppError('Cannot delete variant with associated records', 400);
      }
      throw error;
    }
  }
}

export default new ProductVariantsService();
