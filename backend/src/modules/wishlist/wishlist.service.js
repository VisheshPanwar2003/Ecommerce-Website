import wishlistRepository from './wishlist.repository.js';
import AppError from '../../utils/AppError.js';

export class WishlistService {
  formatWishlistItem(item) {
    if (!item) return null;
    const price = Number(item.product.price);
    const discount = Number(item.product.discount || 0);
    const discountPrice = Number(Math.max(0, price - discount).toFixed(2));

    return {
      id: item.id,
      wishlistId: item.wishlistId,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price,
        discount,
        discountPrice,
        stock: item.product.stock,
        status: item.product.status,
        category: item.product.category
          ? {
              id: item.product.category.id,
              name: item.product.category.name,
              slug: item.product.category.slug,
              isActive: item.product.category.isActive
            }
          : null,
        image: item.product.images?.[0] || null
      }
    };
  }

  formatWishlist(wishlist) {
    if (!wishlist) return null;
    const formattedItems = (wishlist.items || []).map((item) => this.formatWishlistItem(item));

    return {
      id: wishlist.id,
      userId: wishlist.userId,
      items: formattedItems,
      itemCount: formattedItems.length,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt
    };
  }

  async getOrCreateWishlist(userId) {
    let wishlist = await wishlistRepository.findWishlistByUserId(userId);
    if (!wishlist) {
      try {
        await wishlistRepository.createWishlist(userId);
      } catch (err) {
        if (err.code !== 'P2002') throw err;
      }
      wishlist = await wishlistRepository.findWishlistByUserId(userId);
    }
    return wishlist;
  }

  async getWishlist(userId) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return this.formatWishlist(wishlist);
  }

  async addItem(userId, productId) {
    // 1. Verify product exists
    const product = await wishlistRepository.findProductForWishlist(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // 2. Product status check: only ACTIVE products can be added
    if (product.status !== 'ACTIVE') {
      throw new AppError('Product is not active', 400);
    }

    // 3. Category status check: product category must be active
    if (!product.category || !product.category.isActive) {
      throw new AppError('Product category is not active', 400);
    }

    // 4. Resolve user wishlist (lazy creation)
    const wishlist = await this.getOrCreateWishlist(userId);

    // 5. Duplicate product check: return existing item cleanly if already in wishlist
    const existingItem = await wishlistRepository.findWishlistItem(wishlist.id, productId);
    if (existingItem) {
      return {
        item: this.formatWishlistItem(existingItem),
        isNew: false
      };
    }

    // 6. Create wishlist item with concurrency protection against duplicate race conditions
    try {
      const newItem = await wishlistRepository.createWishlistItem({
        wishlistId: wishlist.id,
        productId
      });

      return {
        item: this.formatWishlistItem(newItem),
        isNew: true
      };
    } catch (err) {
      if (err.code === 'P2002') {
        const item = await wishlistRepository.findWishlistItem(wishlist.id, productId);
        return {
          item: this.formatWishlistItem(item),
          isNew: false
        };
      }
      throw err;
    }
  }

  async removeItem(userId, itemId) {
    const item = await wishlistRepository.findWishlistItemById(itemId);
    if (!item || item.wishlist.userId !== userId) {
      throw new AppError('Wishlist item not found', 404);
    }

    await wishlistRepository.deleteWishlistItem(itemId);
  }

  async clearWishlist(userId) {
    const wishlist = await wishlistRepository.findWishlistByUserId(userId);
    if (wishlist) {
      await wishlistRepository.clearWishlistItems(wishlist.id);
    }
  }
}

export default new WishlistService();
