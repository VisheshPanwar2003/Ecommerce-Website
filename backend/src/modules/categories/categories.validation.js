import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(1, 'Category name cannot be empty')
      .max(100, 'Category name cannot exceed 100 characters'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(slugRegex, 'Slug must contain only lowercase alphanumeric characters separated by single hyphens')
      .min(1, 'Slug cannot be empty')
      .max(120, 'Slug cannot exceed 120 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
      .nullable(),
    isActive: z.boolean().optional()
  })
};

export const updateCategorySchema = {
  params: z.object({
    id: z.string().uuid('Invalid category ID format')
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Category name cannot be empty')
        .max(100, 'Category name cannot exceed 100 characters')
        .optional(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(slugRegex, 'Slug must contain only lowercase alphanumeric characters separated by single hyphens')
        .min(1, 'Slug cannot be empty')
        .max(120, 'Slug cannot exceed 120 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .max(500, 'Description cannot exceed 500 characters')
        .optional()
        .nullable(),
      isActive: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
};

export const categoryIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid category ID format')
  })
};
