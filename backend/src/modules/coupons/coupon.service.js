import { Prisma } from '@prisma/client';
import couponRepository from './coupon.repository.js';
import AppError from '../../utils/AppError.js';

export class CouponService {
  /**
   * Validate a coupon against customer context and subtotal.
   * Authoritative calculation: discount never exceeds subtotal.
   */
  async validateCoupon({ code, userId, subtotal, tx }) {
    if (!code || typeof code !== 'string') {
      throw new AppError('Coupon code is required', 400);
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await couponRepository.findByCode(normalizedCode, tx);

    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    if (!coupon.isActive) {
      throw new AppError('Coupon is inactive', 400);
    }

    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
      throw new AppError('Coupon has expired', 400);
    }

    const subtotalDec = new Prisma.Decimal(subtotal || 0);

    if (coupon.minOrderAmount && subtotalDec.lt(coupon.minOrderAmount)) {
      throw new AppError(
        `Minimum order amount of ₹${Number(coupon.minOrderAmount).toFixed(2)} required to use this coupon`,
        400
      );
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit has been reached', 400);
    }

    // Calculate authoritative discount
    let discountDecimal = new Prisma.Decimal(0);
    if (coupon.discountType === 'PERCENTAGE') {
      discountDecimal = subtotalDec.mul(coupon.discountValue).div(100);
    } else if (coupon.discountType === 'FIXED') {
      discountDecimal = new Prisma.Decimal(coupon.discountValue);
    }

    // Discount can never exceed subtotal
    if (discountDecimal.gt(subtotalDec)) {
      discountDecimal = subtotalDec;
    }

    // Format to 2 decimal places
    discountDecimal = new Prisma.Decimal(discountDecimal.toFixed(2));

    return {
      coupon,
      discountAmount: discountDecimal,
      discountFormatted: discountDecimal.toFixed(2),
      subtotal: subtotalDec
    };
  }

  /**
   * Admin: Create a new platform coupon.
   */
  async createCoupon(data) {
    const normalizedCode = data.code.trim().toUpperCase();
    const existing = await couponRepository.findByCode(normalizedCode);
    if (existing) {
      throw new AppError('Coupon with this code already exists', 409);
    }

    return couponRepository.create({
      ...data,
      code: normalizedCode
    });
  }

  /**
   * Admin: List all coupons.
   */
  async getAllCoupons() {
    return couponRepository.findAll();
  }

  /**
   * Admin: Get single coupon by ID.
   */
  async getCouponById(id) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    return coupon;
  }

  /**
   * Admin: Update coupon.
   */
  async updateCoupon(id, data) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new AppError('Coupon not found', 404);
    }

    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      if (normalizedCode !== existing.code) {
        const duplicate = await couponRepository.findByCode(normalizedCode);
        if (duplicate) {
          throw new AppError('Coupon with this code already exists', 409);
        }
      }
      data.code = normalizedCode;
    }

    return couponRepository.update(id, data);
  }

  /**
   * Admin: Delete coupon.
   * If coupon has historical usages, deactivate to preserve order records.
   */
  async deleteCoupon(id) {
    const existing = await couponRepository.findById(id);
    if (!existing) {
      throw new AppError('Coupon not found', 404);
    }

    const usageCount = await couponRepository.countUsages(id);
    if (usageCount > 0) {
      // Historical references exist -> deactivate rather than breaking references
      await couponRepository.update(id, { isActive: false });
      return {
        deactivated: true,
        message: 'Coupon has historical usages and was deactivated to preserve order history'
      };
    }

    await couponRepository.delete(id);
    return {
      deactivated: false,
      message: 'Coupon deleted successfully'
    };
  }
}

export default new CouponService();
