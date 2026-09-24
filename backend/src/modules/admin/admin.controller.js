import adminService from './admin.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const metrics = await adminService.getDashboard();
  return res.status(200).json({
    success: true,
    data: metrics
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers(req.query);
  return res.status(200).json({
    success: true,
    data: { users }
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await adminService.updateUserStatus(id, status);

  return res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: { user }
  });
});

export const getSellers = asyncHandler(async (req, res) => {
  const sellers = await adminService.getSellers(req.query);
  return res.status(200).json({
    success: true,
    data: { sellers }
  });
});

export const updateSellerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const seller = await adminService.updateSellerStatus(id, status);

  return res.status(200).json({
    success: true,
    message: `Seller status updated to ${status}`,
    data: { seller }
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const products = await adminService.getProducts(req.query);
  return res.status(200).json({
    success: true,
    data: { products }
  });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const product = await adminService.updateProductStatus(id, status);

  return res.status(200).json({
    success: true,
    message: `Product status updated to ${status}`,
    data: { product }
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getCategories();
  return res.status(200).json({
    success: true,
    data: { categories }
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);
  return res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await adminService.updateCategory(id, req.body);
  return res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await adminService.deleteCategory(id);
  return res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await adminService.getOrders(req.query);
  return res.status(200).json({
    success: true,
    data: { orders }
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await adminService.getOrderById(id);
  return res.status(200).json({
    success: true,
    data: { order }
  });
});

export default {
  getDashboard,
  getUsers,
  updateUserStatus,
  getSellers,
  updateSellerStatus,
  getProducts,
  updateProductStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrderById
};
