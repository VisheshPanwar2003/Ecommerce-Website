import productVariantsService from './productVariants.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getVariants = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variants = await productVariantsService.getVariantsByProductId(productId);

  return res.status(200).json({
    success: true,
    data: { variants }
  });
});

export const createVariant = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variant = await productVariantsService.createVariant(productId, req.user, req.body);

  return res.status(201).json({
    success: true,
    message: 'Product variant created successfully',
    data: { variant }
  });
});

export const updateVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const variant = await productVariantsService.updateVariant(productId, variantId, req.user, req.body);

  return res.status(200).json({
    success: true,
    message: 'Product variant updated successfully',
    data: { variant }
  });
});

export const deleteVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  await productVariantsService.deleteVariant(productId, variantId, req.user);

  return res.status(204).send();
});

export default {
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant
};
