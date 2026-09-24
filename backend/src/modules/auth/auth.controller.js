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

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken } = await authService.loginUser({ email, password });

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

export const checkAdmin = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin access granted'
  });
});

export default {
  register,
  login,
  getMe,
  checkAdmin
};
