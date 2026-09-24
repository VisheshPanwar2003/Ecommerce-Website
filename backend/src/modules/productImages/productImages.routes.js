import { Router } from 'express';
import {
  getImages,
  createImage,
  updateImage,
  deleteImage
} from './productImages.controller.js';
import {
  createImageSchema,
  updateImageSchema,
  listImagesSchema,
  imageParamSchema
} from './productImages.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router({ mergeParams: true });

// Public read route
router.get('/', validate(listImagesSchema), getImages);

// Seller/Admin mutation routes
router.post(
  '/',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(createImageSchema),
  createImage
);

router.patch(
  '/:imageId',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(updateImageSchema),
  updateImage
);

router.delete(
  '/:imageId',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validate(imageParamSchema),
  deleteImage
);

export default router;
