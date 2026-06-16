import { z } from 'zod';

export const UuidParam = z.object({
  id: z.string().uuid('Invalid category ID'),
});

export const CreateCategoryBody = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
});

export const UpdateCategoryBody = z.object({
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBody>;
