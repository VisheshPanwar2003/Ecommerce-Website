import AppError from '../utils/AppError.js';

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Unauthorized: Authentication required', 401));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Forbidden: Insufficient privileges', 403));
  }

  next();
};

export default requireRole;
