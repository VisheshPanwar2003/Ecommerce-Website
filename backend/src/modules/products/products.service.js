import productsRepository from './products.repository.js';
import AppError from '../../utils/AppError.js';

export class ProductsService {
  async getAllProducts(filter = {}) {
    return productsRepository.findAll(filter);
  }

  async getProductById(id) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async createProduct(user, productData) {
    let resolvedSellerId;

    if (user.role === 'SELLER') {
      const seller = await productsRepository.findSellerByUserId(user.id);
      if (!seller) {
        throw new AppError('Seller profile not found. Please register as a seller first.', 400);
      }
      if (seller.status === 'SUSPENDED') {
        throw new AppError('Seller account is suspended', 403);
      }
      resolvedSellerId = seller.id;
    } else if (user.role === 'ADMIN') {
      if (productData.sellerId) {
        const seller = await productsRepository.findSellerById(productData.sellerId);
        if (!seller) {
          throw new AppError('Specified seller not found', 404);
        }
        resolvedSellerId = seller.id;
      } else {
        const seller = await productsRepository.findSellerByUserId(user.id);
        if (!seller) {
          throw new AppError('sellerId is required when creating a product as ADMIN without a personal seller profile', 400);
        }
        resolvedSellerId = seller.id;
      }
    } else {
      throw new AppError('Forbidden: Insufficient privileges', 403);
    }

    // Foreign-key validation: Category must exist and be active
    const category = await productsRepository.findCategoryById(productData.categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    if (!category.isActive) {
      throw new AppError('Cannot assign product to an inactive category', 400);
    }

    // SKU handling
    let finalSku;
    if (productData.sku) {
      finalSku = productData.sku.trim().toUpperCase();
      const existingSku = await productsRepository.findBySku(finalSku);
      if (existingSku) {
        throw new AppError('Product with this SKU already exists', 409);
      }
    } else {
      const prefix = productData.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROD';
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      finalSku = `${prefix}-${timestamp}-${random}`;
    }

    try {
      return await productsRepository.create({
        sellerId: resolvedSellerId,
        categoryId: productData.categoryId,
        name: productData.name.trim(),
        description: productData.description ? productData.description.trim() : null,
        sku: finalSku,
        price: productData.price,
        discount: productData.discount !== undefined ? productData.discount : 0,
        stock: productData.stock !== undefined ? productData.stock : 0,
        status: productData.status || 'ACTIVE'
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new AppError('Product with this SKU already exists', 409);
      }
      throw error;
    }
  }

  async updateProduct(id, user, updateData) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Ownership check
    if (user.role === 'SELLER') {
      const seller = await productsRepository.findSellerByUserId(user.id);
      if (!seller || product.sellerId !== seller.id) {
        throw new AppError('Forbidden: You do not have permission to modify this product', 403);
      }
    } else if (user.role !== 'ADMIN') {
      throw new AppError('Forbidden: Insufficient privileges', 403);
    }

    // Foreign-key validation if category is being updated
    if (updateData.categoryId) {
      const category = await productsRepository.findCategoryById(updateData.categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
      if (!category.isActive) {
        throw new AppError('Cannot assign product to an inactive category', 400);
      }
    }

    // Check SKU if being updated
    if (updateData.sku) {
      const trimmedSku = updateData.sku.trim().toUpperCase();
      if (trimmedSku !== product.sku) {
        const existingSku = await productsRepository.findBySku(trimmedSku);
        if (existingSku && existingSku.id !== id) {
          throw new AppError('Product with this SKU already exists', 409);
        }
      }
    }

    // Check discount <= price
    const effectivePrice = updateData.price !== undefined ? updateData.price : Number(product.price);
    const effectiveDiscount = updateData.discount !== undefined ? updateData.discount : Number(product.discount);
    if (effectiveDiscount > effectivePrice) {
      throw new AppError('Discount cannot be greater than price', 400);
    }

    const payload = {};
    if (updateData.name !== undefined) payload.name = updateData.name.trim();
    if (updateData.description !== undefined) {
      payload.description = updateData.description ? updateData.description.trim() : null;
    }
    if (updateData.categoryId !== undefined) payload.categoryId = updateData.categoryId;
    if (updateData.price !== undefined) payload.price = updateData.price;
    if (updateData.discount !== undefined) payload.discount = updateData.discount;
    if (updateData.stock !== undefined) payload.stock = updateData.stock;
    if (updateData.status !== undefined) payload.status = updateData.status;
    if (updateData.sku !== undefined) payload.sku = updateData.sku.trim().toUpperCase();

    try {
      return await productsRepository.update(id, payload);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new AppError('Product with this SKU already exists', 409);
      }
      throw error;
    }
  }

  async deleteProduct(id, user) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Ownership check
    if (user.role === 'SELLER') {
      const seller = await productsRepository.findSellerByUserId(user.id);
      if (!seller || product.sellerId !== seller.id) {
        throw new AppError('Forbidden: You do not have permission to delete this product', 403);
      }
    } else if (user.role !== 'ADMIN') {
      throw new AppError('Forbidden: Insufficient privileges', 403);
    }

    // Relational check for order items
    const orderItemCount = await productsRepository.countOrderItems(id);
    if (orderItemCount > 0) {
      throw new AppError('Cannot delete product with existing order history. Consider setting status to INACTIVE instead.', 400);
    }

    try {
      await productsRepository.delete(id);
    } catch (error) {
      if (error.code === 'P2003') {
        throw new AppError('Cannot delete product with associated records', 400);
      }
      throw error;
    }
  }
}

export default new ProductsService();
