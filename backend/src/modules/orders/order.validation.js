import { z } from 'zod';

export const orderIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID format')
  })
};

export const createOrderSchema = {
  body: z
    .object({
      addressId: z.string().uuid('Invalid address ID format').optional().nullable(),
      couponCode: z
        .string()
        .trim()
        .max(50, 'Coupon code cannot exceed 50 characters')
        .optional()
        .nullable(),
      shippingAddress: z
        .object({
          fullName: z.string().trim().min(1, 'Full name cannot be empty').max(100),
          phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(20),
          addressLine: z.string().trim().min(1, 'Address line cannot be empty').max(200),
          city: z.string().trim().min(1, 'City cannot be empty').max(100),
          state: z.string().trim().min(1, 'State cannot be empty').max(100),
          postalCode: z.string().trim().min(1, 'Postal code cannot be empty').max(20),
          country: z.string().trim().min(1).max(100).optional()
        })
        .strict()
        .optional()
        .nullable(),
      shippingFullName: z.string().trim().min(1).max(100).optional().nullable(),
      shippingPhone: z.string().trim().min(5).max(20).optional().nullable(),
      shippingAddressLine: z.string().trim().min(1).max(200).optional().nullable(),
      shippingCity: z.string().trim().min(1).max(100).optional().nullable(),
      shippingState: z.string().trim().min(1).max(100).optional().nullable(),
      shippingPostalCode: z.string().trim().min(1).max(20).optional().nullable(),
      shippingCountry: z.string().trim().min(1).max(100).optional().nullable(),
      // Ignored client calculation fields (server enforces authoritative DB prices)
      discount: z.union([z.string(), z.number()]).optional().nullable(),
      subtotal: z.union([z.string(), z.number()]).optional().nullable(),
      total: z.union([z.string(), z.number()]).optional().nullable(),
      shipping: z.union([z.string(), z.number()]).optional().nullable(),
      _simulateFailureAfterDeduction: z.boolean().optional()
    })
    .strict()
    .optional()
};

export default {
  orderIdParamSchema,
  createOrderSchema
};
