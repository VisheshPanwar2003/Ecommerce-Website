import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import orderService from '../../src/modules/orders/order.service.js';
import checkoutService from '../../src/modules/checkout/checkout.service.js';

describe('Unit: Shipping Calculation Logic', () => {
  it('should charge 99.00 shipping when subtotal is below 1000', () => {
    const subtotal = new Prisma.Decimal(500);
    const shipping = orderService.calculateShipping(subtotal);
    expect(shipping.toNumber()).toBe(99);
  });

  it('should provide free shipping (0.00) when subtotal is exactly 1000', () => {
    const subtotal = new Prisma.Decimal(1000);
    const shipping = orderService.calculateShipping(subtotal);
    expect(shipping.toNumber()).toBe(0);
  });

  it('should provide free shipping (0.00) when subtotal exceeds 1000', () => {
    const subtotal = new Prisma.Decimal(2500);
    const shipping = orderService.calculateShipping(subtotal);
    expect(shipping.toNumber()).toBe(0);
  });

  it('should charge 99.00 shipping at boundary value 999.99', () => {
    const subtotal = new Prisma.Decimal('999.99');
    const shipping = orderService.calculateShipping(subtotal);
    expect(shipping.toNumber()).toBe(99);
  });

  it('checkoutService: should return 0.00 shipping when cart is empty or item count is 0', () => {
    const subtotal = new Prisma.Decimal(0);
    const shipping = checkoutService.calculateShipping(subtotal, 0);
    expect(shipping.toNumber()).toBe(0);
  });
});
