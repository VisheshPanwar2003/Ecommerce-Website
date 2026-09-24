import checkoutService from './checkout.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getCheckoutSummary = asyncHandler(async (req, res) => {
  const summary = await checkoutService.getCheckoutSummary(req.user.id);

  return res.status(200).json({
    success: true,
    data: summary
  });
});

export default {
  getCheckoutSummary
};
