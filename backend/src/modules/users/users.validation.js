import { z } from 'zod';

export const updateProfileSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(1, 'Name cannot be empty')
      .max(100, 'Name cannot exceed 100 characters')
  })
};

export const createAddressSchema = {
  body: z.object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(1, 'Full name cannot be empty')
      .max(100, 'Full name cannot exceed 100 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(5, 'Phone number must be at least 5 digits')
      .max(20, 'Phone number cannot exceed 20 characters'),
    addressLine: z
      .string({ required_error: 'Address line is required' })
      .trim()
      .min(1, 'Address line cannot be empty')
      .max(200, 'Address line cannot exceed 200 characters'),
    city: z
      .string({ required_error: 'City is required' })
      .trim()
      .min(1, 'City cannot be empty')
      .max(100, 'City cannot exceed 100 characters'),
    state: z
      .string({ required_error: 'State is required' })
      .trim()
      .min(1, 'State cannot be empty')
      .max(100, 'State cannot exceed 100 characters'),
    postalCode: z
      .string({ required_error: 'Postal code is required' })
      .trim()
      .min(1, 'Postal code cannot be empty')
      .max(20, 'Postal code cannot exceed 20 characters'),
    country: z
      .string({ required_error: 'Country is required' })
      .trim()
      .min(1, 'Country cannot be empty')
      .max(100, 'Country cannot exceed 100 characters'),
    isDefault: z.boolean().optional()
  })
};

export const updateAddressSchema = {
  params: z.object({
    addressId: z.string().uuid('Invalid address ID')
  }),
  body: z.object({
    fullName: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().min(5).max(20).optional(),
    addressLine: z.string().trim().min(1).max(200).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    postalCode: z.string().trim().min(1).max(20).optional(),
    country: z.string().trim().min(1).max(100).optional(),
    isDefault: z.boolean().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
};

export const addressIdParamSchema = {
  params: z.object({
    addressId: z.string().uuid('Invalid address ID')
  })
};
