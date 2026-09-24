import productImagesRepository from './productImages.repository.js';
import AppError from '../../utils/AppError.js';

export class ProductImagesService {
  async verifyProductOwnership(productId, user) {
    const product = await productImagesRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (user.role === 'SELLER') {
      const seller = await productImagesRepository.findSellerByUserId(user.id);
      if (!seller || product.sellerId !== seller.id) {
        throw new AppError('Forbidden: You do not have permission to manage images for this product', 403);
      }
    } else if (user.role !== 'ADMIN') {
      throw new AppError('Forbidden: Insufficient privileges', 403);
    }

    return product;
  }

  async getImagesByProductId(productId) {
    const product = await productImagesRepository.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return productImagesRepository.findByProductId(productId);
  }

  async createImage(productId, user, imageData) {
    await this.verifyProductOwnership(productId, user);

    return productImagesRepository.create({
      productId,
      url: imageData.url.trim(),
      altText: imageData.altText ? imageData.altText.trim() : null,
      displayOrder: imageData.displayOrder !== undefined ? imageData.displayOrder : 0
    });
  }

  async updateImage(productId, imageId, user, updateData) {
    await this.verifyProductOwnership(productId, user);

    const image = await productImagesRepository.findById(imageId);
    if (!image) {
      throw new AppError('Image not found', 404);
    }

    // Nested resource validation: Image must belong to the specified product
    if (image.productId !== productId) {
      throw new AppError('Image does not belong to the specified product', 404);
    }

    const payload = {};
    if (updateData.url !== undefined) payload.url = updateData.url.trim();
    if (updateData.altText !== undefined) {
      payload.altText = updateData.altText ? updateData.altText.trim() : null;
    }
    if (updateData.displayOrder !== undefined) payload.displayOrder = updateData.displayOrder;

    return productImagesRepository.update(imageId, payload);
  }

  async deleteImage(productId, imageId, user) {
    await this.verifyProductOwnership(productId, user);

    const image = await productImagesRepository.findById(imageId);
    if (!image) {
      throw new AppError('Image not found', 404);
    }

    // Nested resource validation
    if (image.productId !== productId) {
      throw new AppError('Image does not belong to the specified product', 404);
    }

    await productImagesRepository.delete(imageId);
  }
}

export default new ProductImagesService();
