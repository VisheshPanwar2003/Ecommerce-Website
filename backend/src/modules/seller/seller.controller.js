import sellerService from './seller.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getDashboardData = asyncHandler(async (req, res) => {
  const data = await sellerService.getDashboardData(req.user, req.query);

  return res.status(200).json({
    success: true,
    data
  });
});

export const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await sellerService.getProducts(req.user, req.query);

  return res.status(200).json({
    success: true,
    data: {
      products
    }
  });
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  const orders = await sellerService.getOrders(req.user, req.query);

  return res.status(200).json({
    success: true,
    data: {
      orders
    }
  });
});

export default {
  getDashboardData,
  getSellerProducts,
  getSellerOrders
};
