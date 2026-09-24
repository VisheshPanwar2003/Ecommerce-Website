import prisma from '../../config/prisma.js';

export class CouponRepository {
  /**
   * Find coupon by unique code.
   */
  async findByCode(code, tx = prisma) {
    return tx.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });
  }

  /**
   * Find coupon by ID.
   */
  async findById(id, tx = prisma) {
    return tx.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });
  }

  /**
   * Find all coupons (admin listing), newest first.
   */
  async findAll(tx = prisma) {
    return tx.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });
  }

  /**
   * Create new coupon.
   */
  async create(data, tx = prisma) {
    return tx.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount ?? null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        usageLimit: data.usageLimit ?? null,
        isActive: data.isActive ?? true
      },
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });
  }

  /**
   * Update existing coupon.
   */
  async update(id, data, tx = prisma) {
    const updateData = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.expirationDate !== undefined) {
      updateData.expirationDate = data.expirationDate ? new Date(data.expirationDate) : null;
    }
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return tx.coupon.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { usages: true }
        }
      }
    });
  }

  /**
   * Hard delete coupon.
   */
  async delete(id, tx = prisma) {
    return tx.coupon.delete({
      where: { id }
    });
  }

  /**
   * Count total usages for a coupon.
   */
  async countUsages(couponId, tx = prisma) {
    return tx.couponUsage.count({
      where: { couponId }
    });
  }

  /**
   * Count usages of a coupon by a specific user.
   */
  async countUserUsage(couponId, userId, tx = prisma) {
    return tx.couponUsage.count({
      where: { couponId, userId }
    });
  }

  /**
   * Atomic conditional usage increment inside transaction.
   * If usageLimit is configured, performs:
   * UPDATE "Coupon" SET "usedCount" = "usedCount" + 1 WHERE id = id AND "usedCount" < "usageLimit"
   * Returns true if affected rows === 1, false if usageLimit reached.
   */
  async atomicIncrementUsage(couponId, usageLimit, tx = prisma) {
    if (usageLimit !== null && usageLimit !== undefined) {
      const result = await tx.coupon.updateMany({
        where: {
          id: couponId,
          usedCount: { lt: usageLimit }
        },
        data: {
          usedCount: { increment: 1 }
        }
      });
      return result.count === 1;
    }

    // Unlimited coupon
    await tx.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: { increment: 1 }
      }
    });
    return true;
  }

  /**
   * Record coupon usage inside transaction context.
   */
  async recordUsage({ couponId, userId, orderId }, tx = prisma) {
    return tx.couponUsage.create({
      data: {
        couponId,
        userId,
        orderId
      }
    });
  }
}

export default new CouponRepository();
