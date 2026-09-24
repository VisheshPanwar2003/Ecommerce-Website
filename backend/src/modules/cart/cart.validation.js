import { z } from 'zod';

export const addItemSchema = {
  body: z.object({
    productId: z
      .string({ required_error: 'Product ID is required' })
      .uuid('Invalid product ID format'),
    variantId: z
      .string()
      .uuid('Invalid variant ID format')
      .optional()
      .nullable(),
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
  })
};

export const updateItemQuantitySchema = {
  params: z.object({
    itemId: z.string().uuid('Invalid item ID format')
  }),
  body: z.object({
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1')
  })
};

export const itemIdParamSchema = {
  params: z.object({
    itemId: z.string().uuid('Invalid item ID format')
  })
};
