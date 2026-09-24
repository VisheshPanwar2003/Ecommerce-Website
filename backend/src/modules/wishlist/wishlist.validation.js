import { z } from 'zod';

export const addItemSchema = {
  body: z.object({
    productId: z
      .string({ required_error: 'Product ID is required' })
      .uuid('Invalid product ID format')
  })
};

export const itemIdParamSchema = {
  params: z.object({
    itemId: z.string().uuid('Invalid item ID format')
  })
};
