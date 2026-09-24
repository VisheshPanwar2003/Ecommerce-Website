import { verifyAccessToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError('Authentication required: Missing Authorization header', 401));
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication required: Invalid Authorization header format', 401));
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.sub || !decoded.role) {
      return next(new AppError('Invalid authentication token', 401));
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};

export default authenticate;
