import { z } from 'zod';

export const couponIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid coupon ID format')
  })
};

export const createCouponSchema = {
  body: z
    .object({
      code: z
        .string({ required_error: 'Coupon code is required' })
        .trim()
        .min(1, 'Coupon code cannot be empty')
        .max(50, 'Coupon code cannot exceed 50 characters'),
      discountType: z.enum(['PERCENTAGE', 'FIXED'], {
        required_error: 'Discount type is required',
        invalid_type_error: 'Discount type must be PERCENTAGE or FIXED'
      }),
      discountValue: z
        .number({
          required_error: 'Discount value is required',
          invalid_type_error: 'Discount value must be a number'
        })
        .positive('Discount value must be greater than 0'),
      minOrderAmount: z
        .number({ invalid_type_error: 'Minimum order amount must be a number' })
        .min(0, 'Minimum order amount cannot be negative')
        .nullable()
        .optional(),
      expirationDate: z
        .string()
        .datetime({ message: 'Expiration date must be a valid ISO datetime' })
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be YYYY-MM-DD or ISO datetime'))
        .nullable()
        .optional(),
      usageLimit: z
        .number({ invalid_type_error: 'Usage limit must be a number' })
        .int('Usage limit must be an integer')
        .min(1, 'Usage limit must be at least 1')
        .nullable()
        .optional(),
      isActive: z.boolean().optional().default(true)
    })
    .superRefine((data, ctx) => {
      if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage discount cannot exceed 100%',
          path: ['discountValue']
        });
      }
    })
};

export const updateCouponSchema = {
  params: z.object({
    id: z.string().uuid('Invalid coupon ID format')
  }),
  body: z
    .object({
      code: z
        .string()
        .trim()
        .min(1, 'Coupon code cannot be empty')
        .max(50, 'Coupon code cannot exceed 50 characters')
        .optional(),
      discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
      discountValue: z
        .number({ invalid_type_error: 'Discount value must be a number' })
        .positive('Discount value must be greater than 0')
        .optional(),
      minOrderAmount: z
        .number({ invalid_type_error: 'Minimum order amount must be a number' })
        .min(0, 'Minimum order amount cannot be negative')
        .nullable()
        .optional(),
      expirationDate: z
        .string()
        .datetime({ message: 'Expiration date must be a valid ISO datetime' })
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be YYYY-MM-DD or ISO datetime'))
        .nullable()
        .optional(),
      usageLimit: z
        .number({ invalid_type_error: 'Usage limit must be a number' })
        .int('Usage limit must be an integer')
        .min(1, 'Usage limit must be at least 1')
        .nullable()
        .optional(),
      isActive: z.boolean().optional()
    })
    .superRefine((data, ctx) => {
      if (data.discountType === 'PERCENTAGE' && data.discountValue !== undefined && data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage discount cannot exceed 100%',
          path: ['discountValue']
        });
      }
    })
};

export const validateCouponSchema = {
  body: z.object({
    code: z
      .string({ required_error: 'Coupon code is required' })
      .trim()
      .min(1, 'Coupon code cannot be empty')
  })
};

export default {
  couponIdParamSchema,
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema
};
