import { z } from 'zod';

export const uuidParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid UUID format')
  })
};

export const updateUserStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED'], {
      errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'SUSPENDED'" })
    })
  })
};

export const updateSellerStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid seller ID format')
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED'], {
      errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'SUSPENDED'" })
    })
  })
};

export const updateProductStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID format')
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'INACTIVE'" })
    })
  })
};
