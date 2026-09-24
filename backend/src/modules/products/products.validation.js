import { z } from 'zod';

const skuRegex = /^[A-Za-z0-9_-]+$/;

export const createProductSchema = {
  body: z
    .object({
      name: z
        .string({ required_error: 'Product name is required' })
        .trim()
        .min(1, 'Product name cannot be empty')
        .max(200, 'Product name cannot exceed 200 characters'),
      description: z
        .string()
        .trim()
        .max(2000, 'Description cannot exceed 2000 characters')
        .optional()
        .nullable(),
      categoryId: z
        .string({ required_error: 'Category ID is required' })
        .uuid('Invalid category ID format'),
      price: z
        .number({ required_error: 'Price is required' })
        .positive('Price must be greater than zero')
        .max(999999.99, 'Price cannot exceed 999,999.99'),
      discount: z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(999999.99, 'Discount cannot exceed 999,999.99')
        .optional()
        .default(0),
      stock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .optional()
        .default(0),
      status: z
        .enum(['ACTIVE', 'INACTIVE'], {
          errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'INACTIVE'" })
        })
        .optional()
        .default('ACTIVE'),
      sku: z
        .string()
        .trim()
        .regex(skuRegex, 'SKU may only contain letters, numbers, hyphens, and underscores')
        .min(3, 'SKU must be at least 3 characters')
        .max(50, 'SKU cannot exceed 50 characters')
        .optional(),
      sellerId: z.string().optional() // Ignored for sellers, optional for admin
    })
    .refine(
      (data) => {
        if (data.discount !== undefined && data.price !== undefined) {
          return data.discount <= data.price;
        }
        return true;
      },
      {
        message: 'Discount cannot be greater than price',
        path: ['discount']
      }
    )
};

export const updateProductSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID format')
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Product name cannot be empty')
        .max(200, 'Product name cannot exceed 200 characters')
        .optional(),
      description: z
        .string()
        .trim()
        .max(2000, 'Description cannot exceed 2000 characters')
        .optional()
        .nullable(),
      categoryId: z.string().uuid('Invalid category ID format').optional(),
      price: z
        .number()
        .positive('Price must be greater than zero')
        .max(999999.99, 'Price cannot exceed 999,999.99')
        .optional(),
      discount: z
        .number()
        .min(0, 'Discount cannot be negative')
        .max(999999.99, 'Discount cannot exceed 999,999.99')
        .optional(),
      stock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .optional(),
      status: z
        .enum(['ACTIVE', 'INACTIVE'], {
          errorMap: () => ({ message: "Status must be either 'ACTIVE' or 'INACTIVE'" })
        })
        .optional(),
      sku: z
        .string()
        .trim()
        .regex(skuRegex, 'SKU may only contain letters, numbers, hyphens, and underscores')
        .min(3, 'SKU must be at least 3 characters')
        .max(50, 'SKU cannot exceed 50 characters')
        .optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update'
    })
    .refine(
      (data) => {
        if (data.discount !== undefined && data.price !== undefined) {
          return data.discount <= data.price;
        }
        return true;
      },
      {
        message: 'Discount cannot be greater than price',
        path: ['discount']
      }
    )
};

export const productIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid product ID format')
  })
};
