import checkoutService from './checkout.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getCheckoutSummary = asyncHandler(async (req, res) => {
  const couponCode = req.query.couponCode || req.query.coupon || req.body?.couponCode || null;
  const summary = await checkoutService.getCheckoutSummary(req.user.id, { couponCode });

  return res.status(200).json({
    success: true,
    data: summary
  });
});

export default {
  getCheckoutSummary
};
