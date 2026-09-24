import usersService from './users.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await usersService.getProfile(req.user.id);

  return res.status(200).json({
    success: true,
    data: { user }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await usersService.updateProfile(req.user.id, { name });

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await usersService.getAddresses(req.user.id);

  return res.status(200).json({
    success: true,
    data: { addresses }
  });
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await usersService.createAddress(req.user.id, req.body);

  return res.status(201).json({
    success: true,
    message: 'Address created successfully',
    data: { address }
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const address = await usersService.updateAddress(addressId, req.user.id, req.body);

  return res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: { address }
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  await usersService.deleteAddress(addressId, req.user.id);

  return res.status(204).send();
});

export default {
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
