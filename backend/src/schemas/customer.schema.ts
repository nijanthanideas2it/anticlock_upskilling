import { z } from 'zod';

export const UuidParam = z.object({
  id: z.string().uuid('Invalid customer ID'),
});

export const ListCustomersQuery = z.object({
  tier: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateCustomerBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  companyName: z.string().max(200).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number')
    .optional(),
  tier: z.enum(['standard', 'premium', 'enterprise']).default('standard'),
});

export const UpdateCustomerBody = z.object({
  companyName: z.string().max(200).optional(),
  primaryContact: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number')
    .optional(),
  tier: z.enum(['standard', 'premium', 'enterprise']).optional(),
});

export type CreateCustomerBodyType = z.infer<typeof CreateCustomerBody>;
export type UpdateCustomerBodyType = z.infer<typeof UpdateCustomerBody>;
