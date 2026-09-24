import healthService from './health.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const getHealth = asyncHandler(async (req, res) => {
  const result = await healthService.checkHealth();

  if (result.database === 'connected') {
    return res.status(200).json({
      success: true,
      message: 'E-commerce API is running',
      database: 'connected'
    });
  }

  return res.status(503).json({
    success: false,
    message: 'E-commerce API is running',
    database: 'disconnected',
    error: result.error
  });
});

export default {
  getHealth
};
