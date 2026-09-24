import { Prisma } from '@prisma/client';
import checkoutRepository from './checkout.repository.js';

export class CheckoutService {
  /**
   * Deterministic shipping calculation:
   * - Empty cart or 0 subtotal => 0.00
   * - subtotal >= 1000 => 0.00
   * - subtotal < 1000 => 99.00
   */
  calculateShipping(subtotalDecimal, itemCount) {
    if (itemCount === 0 || subtotalDecimal.isZero()) {
      return new Prisma.Decimal(0);
    }
    if (subtotalDecimal.gte(1000)) {
      return new Prisma.Decimal(0);
    }
    return new Prisma.Decimal(99);
  }

  async getCheckoutSummary(userId) {
    const cart = await checkoutRepository.findCartForCheckout(userId);

    const items = cart?.items || [];
    let subtotalDecimal = new Prisma.Decimal(0);
    const discountDecimal = new Prisma.Decimal(0); // Scope: 0.00 for Task 17
    let allItemsAvailable = items.length > 0;

    const formattedItems = items.map((item) => {
      let isAvailable = true;
      let availabilityReason = null;

      // 1. Check product existence
      if (!item.product) {
        isAvailable = false;
        availabilityReason = 'Product no longer exists';
      }
      // 2. Check product status
      else if (item.product.status !== 'ACTIVE') {
        isAvailable = false;
        availabilityReason = 'Product is no longer active';
      }
      // 3. Check product category
      else if (!item.product.category || !item.product.category.isActive) {
        isAvailable = false;
        availabilityReason = 'Product category is inactive';
      }
      // 4. Check variant if item specifies one
      else if (item.variantId) {
        if (!item.variant) {
          isAvailable = false;
          availabilityReason = 'Selected variant no longer exists';
        } else if (item.variant.productId !== item.productId) {
          isAvailable = false;
          availabilityReason = 'Variant does not belong to product';
        } else if (!item.variant.isActive) {
          isAvailable = false;
          availabilityReason = 'Selected variant is inactive';
        }
      }

      // 5. Determine available stock
      let availableStock = 0;
      if (item.product) {
        availableStock = item.variant ? item.variant.stock : item.product.stock;
      }

      // 6. Check stock level against requested quantity
      if (isAvailable) {
        if (availableStock <= 0) {
          isAvailable = false;
          availabilityReason = 'Out of stock';
        } else if (item.quantity > availableStock) {
          isAvailable = false;
          availabilityReason = `Insufficient stock (requested ${item.quantity}, available ${availableStock})`;
        }
      }

      if (!isAvailable) {
        allItemsAvailable = false;
      }

      // 7. Authoritative price resolution from database
      let unitPriceDecimal = new Prisma.Decimal(0);
      if (item.product) {
        const rawPrice =
          item.variant?.price != null ? item.variant.price : item.product.price;
        unitPriceDecimal = new Prisma.Decimal(rawPrice);
      }

      const itemSubtotalDecimal = unitPriceDecimal.mul(item.quantity);
      subtotalDecimal = subtotalDecimal.add(itemSubtotalDecimal);

      return {
        cartItemId: item.id,
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.variant ? `${item.product.name} - ${item.variant.name}` : item.product?.name || 'Unknown',
        productName: item.product?.name || null,
        variantName: item.variant?.name || null,
        sku: item.variant?.sku || item.product?.sku || null,
        seller: item.product?.seller
          ? {
              id: item.product.seller.id,
              name: item.product.seller.storeName
            }
          : null,
        quantity: item.quantity,
        unitPrice: unitPriceDecimal.toFixed(2),
        subtotal: itemSubtotalDecimal.toFixed(2),
        availableStock,
        isAvailable,
        availabilityReason
      };
    });

    const shippingDecimal = this.calculateShipping(subtotalDecimal, items.length);
    const totalDecimal = subtotalDecimal.add(shippingDecimal).sub(discountDecimal);

    return {
      canCheckout: allItemsAvailable,
      items: formattedItems,
      subtotal: subtotalDecimal.toFixed(2),
      discount: discountDecimal.toFixed(2),
      shipping: shippingDecimal.toFixed(2),
      total: totalDecimal.toFixed(2)
    };
  }
}

export default new CheckoutService();
