import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import couponService from '../../src/modules/coupons/coupon.service.js';
import AppError from '../../src/utils/AppError.js';

describe('Unit: Coupon Discount Calculation', () => {
  it('should accurately calculate percentage discount (20% of 1000 = 200.00)', () => {
    const coupon = {
      code: 'PERCENT20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: null,
      isActive: true,
      expirationDate: null,
      usageLimit: null,
      usedCount: 0
    };

    const result = couponService.calculateDiscount(coupon, 1000);
    expect(result.discountFormatted).toBe('200.00');
    expect(result.discountAmount.toNumber()).toBe(200);
  });

  it('should accurately calculate fixed amount discount (150.00)', () => {
    const coupon = {
      code: 'FLAT150',
      discountType: 'FIXED',
      discountValue: 150,
      minOrderAmount: null,
      isActive: true,
      expirationDate: null,
      usageLimit: null,
      usedCount: 0
    };

    const result = couponService.calculateDiscount(coupon, 500);
    expect(result.discountFormatted).toBe('150.00');
    expect(result.discountAmount.toNumber()).toBe(150);
  });

  it('should cap discount at subtotal when discount exceeds subtotal', () => {
    const coupon = {
      code: 'FLAT500',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderAmount: null,
      isActive: true,
      expirationDate: null,
      usageLimit: null,
      usedCount: 0
    };

    // Subtotal is only 300, discount cannot exceed 300
    const result = couponService.calculateDiscount(coupon, 300);
    expect(result.discountFormatted).toBe('300.00');
    expect(result.discountAmount.toNumber()).toBe(300);
  });

  it('should throw 400 when subtotal is below minOrderAmount', () => {
    const coupon = {
      code: 'MIN1000',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1000,
      isActive: true,
      expirationDate: null,
      usageLimit: null,
      usedCount: 0
    };

    expect(() => {
      couponService.calculateDiscount(coupon, 800);
    }).toThrow(AppError);
  });

  it('should throw 400 when coupon is inactive', () => {
    const coupon = {
      code: 'INACTIVE',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: null,
      isActive: false,
      expirationDate: null,
      usageLimit: null,
      usedCount: 0
    };

    expect(() => {
      couponService.calculateDiscount(coupon, 1000);
    }).toThrow('Coupon is inactive');
  });

  it('should throw 400 when coupon has expired', () => {
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    const coupon = {
      code: 'EXPIRED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: null,
      isActive: true,
      expirationDate: pastDate,
      usageLimit: null,
      usedCount: 0
    };

    expect(() => {
      couponService.calculateDiscount(coupon, 1000);
    }).toThrow('Coupon has expired');
  });

  it('should throw 400 when usageLimit has been reached', () => {
    const coupon = {
      code: 'LIMITED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: null,
      isActive: true,
      expirationDate: null,
      usageLimit: 5,
      usedCount: 5
    };

    expect(() => {
      couponService.calculateDiscount(coupon, 1000);
    }).toThrow('Coupon usage limit has been reached');
  });
});
