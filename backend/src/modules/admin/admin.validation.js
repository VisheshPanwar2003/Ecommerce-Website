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

export const getUsersQuerySchema = {
  query: z
    .object({
      search: z.string().trim().max(100).optional(),
      role: z.enum(['CUSTOMER', 'SELLER', 'ADMIN']).optional(),
      status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional()
    })
    .optional()
};

export const getSellersQuerySchema = {
  query: z
    .object({
      search: z.string().trim().max(100).optional(),
      status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional()
    })
    .optional()
};

export const getOrdersQuerySchema = {
  query: z
    .object({
      search: z.string().trim().max(100).optional(),
      status: z
        .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        .optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional()
    })
    .optional()
};
