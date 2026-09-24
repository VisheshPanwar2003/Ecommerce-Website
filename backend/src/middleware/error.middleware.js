import { ZodError } from 'zod';
import env from '../config/env.js';

/**
 * Sanitizes messages to guarantee sensitive configuration secrets
 * (such as database credentials or JWT secrets) are never exposed to clients.
 */
const sanitizeMessage = (message) => {
  if (typeof message !== 'string') {
    return 'Internal server error';
  }

  let sanitized = message;
  if (env.DATABASE_URL) {
    sanitized = sanitized.split(env.DATABASE_URL).join('[REDACTED]');
  }
  if (process.env.DATABASE_URL) {
    sanitized = sanitized.split(process.env.DATABASE_URL).join('[REDACTED]');
  }
  if (env.JWT_SECRET) {
    sanitized = sanitized.split(env.JWT_SECRET).join('[REDACTED]');
  }
  if (process.env.JWT_SECRET) {
    sanitized = sanitized.split(process.env.JWT_SECRET).join('[REDACTED]');
  }

  return sanitized;
};

export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = 'Internal server error';
  let details = err.details || null;
  let errors = null;

  // 1. Zod validation errors
  if (err instanceof ZodError || err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = (err.issues || []).map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
  }
  // 2. Prisma known request errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      message = `A resource with this ${target} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference or related resource not found';
    } else {
      statusCode = 500;
      message = 'Database operation failed';
    }
  }
  // 3. Prisma client validation errors
  else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided for database operation';
  }
  // 4. JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }
  // 5. Express JSON body parser syntax errors
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }
  // 6. CORS error
  else if (err.message === 'CORS not allowed for this origin') {
    statusCode = 403;
    message = 'CORS origin not allowed';
  }
  // 7. Operational AppErrors (statusCode < 500)
  else if (err.isOperational && statusCode < 500) {
    message = sanitizeMessage(err.message);
  }
  // 8. Unexpected server errors (>= 500)
  else {
    statusCode = 500;
    message = 'Internal server error';
  }

  // Server-side logging for diagnostics
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`[CLIENT ERROR] ${req.method} ${req.originalUrl}: ${message}`);
  }

  const response = {
    success: false,
    message
  };

  if (details) {
    response.details = details;
  }

  if (errors) {
    response.errors = errors;
  }

  // Stack traces and internal secrets are NEVER leaked in HTTP response
  res.status(statusCode).json(response);
};

export default errorMiddleware;
