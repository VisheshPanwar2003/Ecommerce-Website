import productsService from './products.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { products, pagination } = await productsService.getAllProducts(req.query);

  return res.status(200).json({
    success: true,
    data: {
      products,
      pagination
    }
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productsService.getProductById(id);

  return res.status(200).json({
    success: true,
    data: { product }
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.user, req.body);

  return res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productsService.updateProduct(id, req.user, req.body);

  return res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productsService.deleteProduct(id, req.user);

  return res.status(204).send();
});

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
