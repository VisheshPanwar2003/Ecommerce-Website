import { z } from 'zod';

export const productIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID format')
  })
};

export const orderIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID format')
  })
};

export const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID format')
  }),
  body: z.object({
    status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
      errorMap: () => ({
        message: "Status must be one of: 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'"
      })
    })
  })
};
