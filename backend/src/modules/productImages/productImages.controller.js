import productImagesService from './productImages.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const images = await productImagesService.getImagesByProductId(productId);

  return res.status(200).json({
    success: true,
    data: { images }
  });
});

export const createImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const image = await productImagesService.createImage(productId, req.user, req.body);

  return res.status(201).json({
    success: true,
    message: 'Product image added successfully',
    data: { image }
  });
});

export const updateImage = asyncHandler(async (req, res) => {
  const { productId, imageId } = req.params;
  const image = await productImagesService.updateImage(productId, imageId, req.user, req.body);

  return res.status(200).json({
    success: true,
    message: 'Product image updated successfully',
    data: { image }
  });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { productId, imageId } = req.params;
  await productImagesService.deleteImage(productId, imageId, req.user);

  return res.status(204).send();
});

export default {
  getImages,
  createImage,
  updateImage,
  deleteImage
};
