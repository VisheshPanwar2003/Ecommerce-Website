import cartRepository from './cart.repository.js';
import AppError from '../../utils/AppError.js';

export class CartService {
  formatCart(cart) {
    if (!cart) return null;
    let cartSubtotal = 0;
    let itemCount = 0;

    const formattedItems = (cart.items || []).map((item) => {
      const unitPrice = Number(item.variant?.price != null ? item.variant.price : item.product.price);
      const itemSubtotal = Number((unitPrice * item.quantity).toFixed(2));
      cartSubtotal += itemSubtotal;
      itemCount += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        itemSubtotal,
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          price: Number(item.product.price),
          discount: Number(item.product.discount),
          stock: item.product.stock,
          status: item.product.status,
          category: item.product.category,
          image: item.product.images?.[0] || null
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              sku: item.variant.sku,
              price: item.variant.price != null ? Number(item.variant.price) : null,
              stock: item.variant.stock,
              isActive: item.variant.isActive
            }
          : null
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: formattedItems,
      itemCount,
      subtotal: Number(cartSubtotal.toFixed(2)),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };
  }

  async getOrCreateCart(userId) {
    let cart = await cartRepository.findCartByUserId(userId);
    if (!cart) {
      await cartRepository.createCart(userId);
      cart = await cartRepository.findCartByUserId(userId);
    }
    return cart;
  }

  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    return this.formatCart(cart);
  }

  async addItem(userId, { productId, variantId, quantity }) {
    // 1. Verify product exists and is active
    const product = await cartRepository.findProductForCart(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    if (product.status !== 'ACTIVE') {
      throw new AppError('Product is not active', 400);
    }
    if (!product.category || !product.category.isActive) {
      throw new AppError('Product category is not active', 400);
    }

    // 2. Verify variant if supplied
    let availableStock;
    if (variantId) {
      const variant = await cartRepository.findVariantForCart(variantId);
      if (!variant) {
        throw new AppError('Variant not found', 404);
      }
      if (variant.productId !== productId) {
        throw new AppError('Variant does not belong to the specified product', 400);
      }
      if (!variant.isActive) {
        throw new AppError('Variant is not active', 400);
      }
      availableStock = variant.stock;
    } else {
      availableStock = product.stock;
    }

    // 3. Resolve cart
    const cart = await this.getOrCreateCart(userId);

    // 4. Duplicate cart item handling
    const existingItem = await cartRepository.findCartItem(cart.id, productId, variantId || null);
    const resultingQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // 5. Stock check
    if (resultingQuantity > availableStock) {
      throw new AppError(
        `Insufficient stock. Available: ${availableStock}, requested total: ${resultingQuantity}`,
        400
      );
    }

    // 6. Insert or update item
    if (existingItem) {
      await cartRepository.updateCartItemQuantity(existingItem.id, resultingQuantity);
    } else {
      await cartRepository.createCartItem({
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId, itemId, quantity) {
    const item = await cartRepository.findCartItemById(itemId);
    if (!item || item.cart.userId !== userId) {
      throw new AppError('Cart item not found', 404);
    }

    // Verify product & category still active
    if (item.product.status !== 'ACTIVE') {
      throw new AppError('Product is no longer active', 400);
    }
    if (!item.product.category?.isActive) {
      throw new AppError('Product category is no longer active', 400);
    }
    if (item.variant && !item.variant.isActive) {
      throw new AppError('Variant is no longer active', 400);
    }

    // Stock check
    const availableStock = item.variant ? item.variant.stock : item.product.stock;
    if (quantity > availableStock) {
      throw new AppError(
        `Insufficient stock. Available: ${availableStock}, requested: ${quantity}`,
        400
      );
    }

    await cartRepository.updateCartItemQuantity(itemId, quantity);
    return this.getCart(userId);
  }

  async removeItem(userId, itemId) {
    const item = await cartRepository.findCartItemById(itemId);
    if (!item || item.cart.userId !== userId) {
      throw new AppError('Cart item not found', 404);
    }

    await cartRepository.deleteCartItem(itemId);
  }

  async clearCart(userId) {
    const cart = await cartRepository.findCartByUserId(userId);
    if (cart) {
      await cartRepository.clearCartItems(cart.id);
    }
  }
}

export default new CartService();
