import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from './users.controller.js';
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema
} from './users.validation.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';

const router = Router();

// Profile endpoints
router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);

// Address endpoints
router.get('/me/addresses', authenticate, getAddresses);
router.post('/me/addresses', authenticate, validate(createAddressSchema), createAddress);
router.patch('/me/addresses/:addressId', authenticate, validate(updateAddressSchema), updateAddress);
router.delete('/me/addresses/:addressId', authenticate, validate(addressIdParamSchema), deleteAddress);

export default router;
