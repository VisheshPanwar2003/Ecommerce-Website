import inventoryService from './inventory.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getInventory(req.user);

  return res.status(200).json({
    success: true,
    data: {
      inventory,
      items: inventory
    }
  });
});

export const getProductInventory = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const inventory = await inventoryService.getProductInventory(req.user, productId);

  return res.status(200).json({
    success: true,
    data: {
      ...inventory,
      inventory
    }
  });
});

export const createMovement = asyncHandler(async (req, res) => {
  const result = await inventoryService.createMovement(req.user, req.body);

  return res.status(201).json({
    success: true,
    message: 'Inventory movement recorded successfully',
    data: result
  });
});

export const getProductMovements = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const movements = await inventoryService.getProductMovements(req.user, productId);

  return res.status(200).json({
    success: true,
    data: {
      productId,
      movements
    }
  });
});

export default {
  getInventory,
  getProductInventory,
  createMovement,
  getProductMovements
};
