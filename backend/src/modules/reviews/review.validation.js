import { z } from 'zod';

export const productIdParamSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  })
};

export const reviewIdParamSchema = {
  params: z.object({
    reviewId: z.string().uuid('Invalid review ID format')
  })
};

export const createReviewSchema = {
  params: z.object({
    productId: z.string().uuid('Invalid product ID format')
  }),
  body: z.object({
    rating: z
      .number({ required_error: 'Rating is required', invalid_type_error: 'Rating must be a number' })
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comment: z
      .string({ required_error: 'Comment is required' })
      .trim()
      .min(1, 'Comment cannot be empty')
      .max(2000, 'Comment cannot exceed 2000 characters')
  })
};

export const updateReviewSchema = {
  params: z.object({
    reviewId: z.string().uuid('Invalid review ID format')
  }),
  body: z
    .object({
      rating: z
        .number({ invalid_type_error: 'Rating must be a number' })
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5')
        .optional(),
      comment: z
        .string()
        .trim()
        .min(1, 'Comment cannot be empty')
        .max(2000, 'Comment cannot exceed 2000 characters')
        .optional()
    })
    .refine((data) => data.rating !== undefined || data.comment !== undefined, {
      message: 'At least one field (rating or comment) must be provided'
    })
};
