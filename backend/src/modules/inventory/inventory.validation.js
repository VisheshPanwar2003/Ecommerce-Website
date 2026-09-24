import { z } from 'zod';

export const productIdParamSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  })
};

export const createMovementSchema = {
  body: z
    .object({
      productId: z
        .string({ required_error: 'Product ID is required' })
        .uuid('Invalid product ID format'),
      variantId: z
        .string()
        .uuid('Invalid variant ID format')
        .optional()
        .nullable(),
      type: z.enum(['RESTOCK', 'ADJUSTMENT', 'RETURN', 'SALE', 'CANCELLATION'], {
        errorMap: () => ({
          message: "Type must be one of: 'RESTOCK', 'ADJUSTMENT', 'RETURN'"
        })
      }),
      quantity: z
        .number({ required_error: 'Quantity is required' })
        .int('Quantity must be an integer'),
      reason: z
        .string({ required_error: 'Reason is required' })
        .trim()
        .min(1, 'Reason cannot be empty')
        .max(500, 'Reason cannot exceed 500 characters')
    })
    .refine(
      (data) => {
        if (data.type === 'SALE' || data.type === 'CANCELLATION') {
          return false;
        }
        return true;
      },
      {
        message: 'Movement types SALE and CANCELLATION are reserved for automated order processing in Task 20',
        path: ['type']
      }
    )
    .refine(
      (data) => {
        if (data.type === 'RESTOCK' || data.type === 'RETURN') {
          return data.quantity > 0;
        }
        if (data.type === 'ADJUSTMENT') {
          return data.quantity !== 0;
        }
        return true;
      },
      {
        message: 'Quantity must be positive for RESTOCK and RETURN, and non-zero for ADJUSTMENT',
        path: ['quantity']
      }
    )
};
