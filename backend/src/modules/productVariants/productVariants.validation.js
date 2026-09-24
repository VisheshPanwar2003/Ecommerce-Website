import { z } from 'zod';

const skuRegex = /^[A-Za-z0-9_-]+$/;

export const createVariantSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  }),
  body: z.object({
    name: z
      .string({ required_error: 'Variant name is required' })
      .trim()
      .min(1, 'Variant name cannot be empty')
      .max(100, 'Variant name cannot exceed 100 characters'),
    sku: z
      .string()
      .trim()
      .regex(skuRegex, 'SKU may only contain letters, numbers, hyphens, and underscores')
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters')
      .optional(),
    price: z
      .number()
      .positive('Price must be greater than zero')
      .max(999999.99, 'Price cannot exceed 999,999.99')
      .optional()
      .nullable(),
    stock: z
      .number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .optional()
      .default(0),
    isActive: z.boolean().optional().default(true)
  })
};

export const updateVariantSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    variantId: z.string().uuid('Invalid variant ID format')
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Variant name cannot be empty')
        .max(100, 'Variant name cannot exceed 100 characters')
        .optional(),
      sku: z
        .string()
        .trim()
        .regex(skuRegex, 'SKU may only contain letters, numbers, hyphens, and underscores')
        .min(3, 'SKU must be at least 3 characters')
        .max(50, 'SKU cannot exceed 50 characters')
        .optional(),
      price: z
        .number()
        .positive('Price must be greater than zero')
        .max(999999.99, 'Price cannot exceed 999,999.99')
        .optional()
        .nullable(),
      stock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .optional(),
      isActive: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
};

export const listVariantsSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  })
};

export const variantParamSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    variantId: z.string().uuid('Invalid variant ID format')
  })
};
