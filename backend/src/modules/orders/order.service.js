import { Prisma } from '@prisma/client';
import orderRepository from './order.repository.js';
import couponService from '../coupons/coupon.service.js';
import couponRepository from '../coupons/coupon.repository.js';
import AppError from '../../utils/AppError.js';

export class OrderService {
  /**
   * Deterministic shipping calculation identical to Task 17:
   * - subtotal >= 1000 => 0.00
   * - subtotal < 1000 => 99.00
   */
  calculateShipping(subtotalDecimal) {
    if (subtotalDecimal.gte(1000)) {
      return new Prisma.Decimal(0);
    }
    return new Prisma.Decimal(99);
  }

  formatOrderItem(item) {
    return {
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      variantId: item.variantId || null,
      sellerId: item.sellerId,
      name: item.variantName ? `${item.productName} - ${item.variantName}` : item.productName,
      productName: item.productName,
      variantName: item.variantName || null,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: new Prisma.Decimal(item.unitPrice).toFixed(2),
      discount: new Prisma.Decimal(item.discount).toFixed(2),
      subtotal: new Prisma.Decimal(item.total).toFixed(2),
      total: new Prisma.Decimal(item.total).toFixed(2),
      seller: item.seller
        ? {
            id: item.seller.id,
            name: item.seller.storeName
          }
        : null
    };
  }

  formatOrder(order) {
    if (!order) return null;

    const items = (order.items || []).map((item) => this.formatOrderItem(item));
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: order.id,
      orderStatus: order.orderStatus,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotal: new Prisma.Decimal(order.subtotal).toFixed(2),
      discount: new Prisma.Decimal(order.discount).toFixed(2),
      shipping: new Prisma.Decimal(order.shippingAmount).toFixed(2),
      shippingAmount: new Prisma.Decimal(order.shippingAmount).toFixed(2),
      total: new Prisma.Decimal(order.totalAmount).toFixed(2),
      totalAmount: new Prisma.Decimal(order.totalAmount).toFixed(2),
      itemCount,
      shippingAddress: {
        fullName: order.shippingFullName,
        phone: order.shippingPhone,
        addressLine: order.shippingAddressLine,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry
      },
      items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  async createOrder(userId, options = {}) {
    const createdOrder = await orderRepository.executeInTransaction(async (tx) => {
      // 1. Load customer cart inside transaction context
      const cart = await orderRepository.findCartForOrder(userId, tx);
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      let subtotalDecimal = new Prisma.Decimal(0);
      let discountDecimal = new Prisma.Decimal(0);
      let validatedCoupon = null;
      const orderItemsData = [];
      const deductionsToPerform = [];

      // 2. Validate all cart items and build purchase-time snapshots
      for (const item of cart.items) {
        if (item.quantity <= 0) {
          throw new AppError('Invalid item quantity', 400);
        }

        // Check product existence
        if (!item.product) {
          throw new AppError('Product not found or unavailable', 404);
        }

        // Check product status
        if (item.product.status !== 'ACTIVE') {
          throw new AppError(`Product "${item.product.name}" is no longer active`, 400);
        }

        // Check product category status
        if (!item.product.category || !item.product.category.isActive) {
          throw new AppError(`Category for "${item.product.name}" is no longer active`, 400);
        }

        // Check variant if applicable
        if (item.variantId) {
          if (!item.variant || item.variant.productId !== item.productId) {
            throw new AppError('Selected product variant was not found', 404);
          }
          if (!item.variant.isActive) {
            throw new AppError(`Variant "${item.variant.name}" is no longer active`, 400);
          }
        }

        // Validate stock availability
        const availableStock = item.variant ? item.variant.stock : item.product.stock;
        if (availableStock <= 0) {
          throw new AppError(`Product "${item.product.name}" is out of stock`, 400);
        }
        if (item.quantity > availableStock) {
          throw new AppError(
            `Insufficient stock for "${item.product.name}". Requested: ${item.quantity}, Available: ${availableStock}`,
            400
          );
        }

        // 3. Resolve authoritative database price snapshot
        const rawPrice =
          item.variant?.price != null ? item.variant.price : item.product.price;
        const unitPriceDecimal = new Prisma.Decimal(rawPrice);
        const itemSubtotal = unitPriceDecimal.mul(item.quantity);
        subtotalDecimal = subtotalDecimal.add(itemSubtotal);

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId || null,
          sellerId: item.product.sellerId,
          productName: item.product.name,
          sku: item.variant?.sku || item.product.sku,
          variantName: item.variant?.name || null,
          quantity: item.quantity,
          unitPrice: unitPriceDecimal,
          discount: new Prisma.Decimal(0),
          total: itemSubtotal
        });

        deductionsToPerform.push({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          name: item.variant ? `${item.product.name} (${item.variant.name})` : item.product.name
        });
      }

      // 3.5. Authoritative Coupon Validation inside Transaction
      if (options.couponCode) {
        const validation = await couponService.validateCoupon({
          code: options.couponCode,
          userId,
          subtotal: subtotalDecimal,
          tx
        });
        discountDecimal = validation.discountAmount;
        validatedCoupon = validation.coupon;

        // Atomic usage limit check and increment inside transaction
        const incrementSuccess = await couponRepository.atomicIncrementUsage(
          validatedCoupon.id,
          validatedCoupon.usageLimit,
          tx
        );
        if (!incrementSuccess) {
          throw new AppError('Coupon usage limit has been reached', 400);
        }
      }

      // 4. Recalculate shipping & final total
      const shippingDecimal = this.calculateShipping(subtotalDecimal);
      const totalDecimal = subtotalDecimal.add(shippingDecimal).sub(discountDecimal);

      // 5. Resolve shipping address snapshot inside transaction context
      let addressSnapshot = null;
      if (options.shippingAddress && typeof options.shippingAddress === 'object') {
        const sa = options.shippingAddress;
        addressSnapshot = {
          fullName: sa.fullName || 'Customer',
          phone: sa.phone || '0000000000',
          addressLine: sa.addressLine || 'Standard Delivery Line',
          city: sa.city || 'City',
          state: sa.state || 'State',
          postalCode: sa.postalCode || '000000',
          country: sa.country || 'India'
        };
      } else if (options.addressId) {
        const userAddr = await orderRepository.findUserAddress(userId, options.addressId, tx);
        if (userAddr) {
          addressSnapshot = {
            fullName: userAddr.fullName,
            phone: userAddr.phone,
            addressLine: userAddr.addressLine,
            city: userAddr.city,
            state: userAddr.state,
            postalCode: userAddr.postalCode,
            country: userAddr.country
          };
        }
      }

      if (!addressSnapshot) {
        const defaultAddr = await orderRepository.findUserAddress(userId, null, tx);
        const user = await orderRepository.findUserById(userId, tx);

        if (defaultAddr) {
          addressSnapshot = {
            fullName: defaultAddr.fullName,
            phone: defaultAddr.phone,
            addressLine: defaultAddr.addressLine,
            city: defaultAddr.city,
            state: defaultAddr.state,
            postalCode: defaultAddr.postalCode,
            country: defaultAddr.country
          };
        } else {
          addressSnapshot = {
            fullName: user?.name || 'Customer',
            phone: user?.phone || '0000000000',
            addressLine: 'Standard Delivery Line',
            city: 'City',
            state: 'State',
            postalCode: '000000',
            country: 'India'
          };
        }
      }

      // 6. ATOMIC CONDITIONAL STOCK DEDUCTION AT DATABASE LEVEL
      // Each deduction executes: UPDATE table SET stock = stock - quantity WHERE id = id AND stock >= quantity
      // If affected rows === 0, stock is no longer available under concurrency.
      for (const deduction of deductionsToPerform) {
        let deductionSucceeded = false;

        if (deduction.variantId) {
          deductionSucceeded = await orderRepository.deductVariantStock(
            tx,
            deduction.variantId,
            deduction.quantity
          );
        } else {
          deductionSucceeded = await orderRepository.deductProductStock(
            tx,
            deduction.productId,
            deduction.quantity
          );
        }

        if (!deductionSucceeded) {
          throw new AppError(
            `Insufficient stock for "${deduction.name}". Requested inventory is no longer available`,
            409
          );
        }
      }

      // Test hook for failure/rollback verification (executed only when requested)
      if (options._simulateFailureAfterDeduction) {
        throw new Error('Simulated post-deduction failure for atomicity test');
      }

      // 7. Create Order with OrderItems inside transaction
      const order = await orderRepository.createOrderWithItems(
        tx,
        {
          userId,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal: subtotalDecimal,
          discount: discountDecimal,
          shippingAmount: shippingDecimal,
          totalAmount: totalDecimal,
          shippingFullName: addressSnapshot.fullName,
          shippingPhone: addressSnapshot.phone,
          shippingAddressLine: addressSnapshot.addressLine,
          shippingCity: addressSnapshot.city,
          shippingState: addressSnapshot.state,
          shippingPostalCode: addressSnapshot.postalCode,
          shippingCountry: addressSnapshot.country
        },
        orderItemsData
      );

      // 8. Create SALE InventoryMovement records inside transaction
      for (const deduction of deductionsToPerform) {
        await orderRepository.createSaleInventoryMovement(tx, {
          productId: deduction.productId,
          variantId: deduction.variantId,
          quantity: deduction.quantity,
          orderId: order.id
        });
      }

      // 8.5. Record CouponUsage inside transaction
      if (validatedCoupon) {
        await couponRepository.recordUsage(
          {
            couponId: validatedCoupon.id,
            userId,
            orderId: order.id
          },
          tx
        );
      }

      // 9. Clear customer's cart inside transaction
      await orderRepository.clearCartItems(tx, cart.id);

      return order;
    });

    return this.formatOrder(createdOrder);
  }

  async getOrderHistory(userId) {
    const orders = await orderRepository.findOrdersByUserId(userId);
    return orders.map((order) => this.formatOrder(order));
  }

  async getOrderById(userId, orderId) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order || order.userId !== userId) {
      throw new AppError('Order not found', 404);
    }
    return this.formatOrder(order);
  }
}

export default new OrderService();
