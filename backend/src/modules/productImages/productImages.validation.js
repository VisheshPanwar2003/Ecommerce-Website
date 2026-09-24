import { z } from 'zod';

export const createImageSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  }),
  body: z.object({
    url: z
      .string({ required_error: 'Image URL is required' })
      .trim()
      .url('Invalid image URL format')
      .max(500, 'Image URL cannot exceed 500 characters'),
    altText: z
      .string()
      .trim()
      .max(200, 'Alt text cannot exceed 200 characters')
      .optional()
      .nullable(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order cannot be negative')
      .optional()
      .default(0)
  })
};

export const updateImageSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    imageId: z.string().uuid('Invalid image ID format')
  }),
  body: z
    .object({
      url: z
        .string()
        .trim()
        .url('Invalid image URL format')
        .max(500, 'Image URL cannot exceed 500 characters')
        .optional(),
      altText: z
        .string()
        .trim()
        .max(200, 'Alt text cannot exceed 200 characters')
        .optional()
        .nullable(),
      displayOrder: z
        .number()
        .int('Display order must be an integer')
        .min(0, 'Display order cannot be negative')
        .optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
};

export const listImagesSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  })
};

export const imageParamSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format'),
    imageId: z.string().uuid('Invalid image ID format')
  })
};
