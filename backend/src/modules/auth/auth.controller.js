import authService from './auth.service.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.registerUser({ name, email, password });

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    }
  });
});

export default {
  register
};
