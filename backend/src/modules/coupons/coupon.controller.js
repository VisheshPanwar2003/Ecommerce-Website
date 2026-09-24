import couponService from './coupon.service.js';
import checkoutRepository from '../checkout/checkout.repository.js';
import asyncHandler from '../../middleware/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { Prisma } from '@prisma/client';

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.getAllCoupons();

  return res.status(200).json({
    success: true,
    data: { coupons }
  });
});

export const getCouponById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await couponService.getCouponById(id);

  return res.status(200).json({
    success: true,
    data: { coupon }
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);

  return res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: { coupon }
  });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await couponService.updateCoupon(id, req.body);

  return res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: { coupon }
  });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await couponService.deleteCoupon(id);

  return res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  // Calculate cart subtotal to validate against
  const cart = await checkoutRepository.findCartForCheckout(userId);
  const items = cart?.items || [];

  let subtotalDecimal = new Prisma.Decimal(0);
  for (const item of items) {
    if (item.product && item.product.status === 'ACTIVE') {
      const rawPrice = item.variant?.price != null ? item.variant.price : item.product.price;
      const unitPrice = new Prisma.Decimal(rawPrice);
      subtotalDecimal = subtotalDecimal.add(unitPrice.mul(item.quantity));
    }
  }

  const result = await couponService.validateCoupon({
    code,
    userId,
    subtotal: subtotalDecimal
  });

  return res.status(200).json({
    success: true,
    message: 'Coupon is valid',
    data: {
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue
      },
      discount: result.discountFormatted,
      subtotal: subtotalDecimal.toFixed(2)
    }
  });
});

export default {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};
