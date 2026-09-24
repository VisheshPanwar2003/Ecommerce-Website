import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.params) {
      req.params = schema.params.parse(req.params || {});
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query || {});
    }
    if (schema.body) {
      req.body = schema.body.parse(req.body || {});
    }
    next();
  } catch (error) {
    if (error instanceof ZodError || error.name === 'ZodError') {
      const formattedErrors = (error.issues || []).map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      });
    }
    next(error);
  }
};

export default validate;
