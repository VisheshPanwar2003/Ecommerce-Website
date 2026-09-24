import categoriesService from './categories.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoriesService.getAllCategories();

  return res.status(200).json({
    success: true,
    data: { categories }
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoriesService.getCategoryById(id);

  return res.status(200).json({
    success: true,
    data: { category }
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoriesService.createCategory(req.body);

  return res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoriesService.updateCategory(id, req.body);

  return res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await categoriesService.deleteCategory(id);

  return res.status(204).send();
});

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
