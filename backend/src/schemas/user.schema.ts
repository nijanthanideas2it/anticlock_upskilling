import { z } from 'zod';
import { Role } from '@prisma/client';

const agentRoles = [Role.SUPPORT_AGENT, Role.SUPPORT_MANAGER] as const;

export const UuidParam = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const ListUsersQuery = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const CreateUserBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(agentRoles, {
    errorMap: () => ({ message: 'Role must be SUPPORT_AGENT or SUPPORT_MANAGER' }),
  }),
});

export const UpdateUserBody = z.object({
  name: z.string().min(2).max(100).optional(),
  isAvailable: z.boolean().optional(),
});

export type CreateUserBodyType = z.infer<typeof CreateUserBody>;
export type UpdateUserBodyType = z.infer<typeof UpdateUserBody>;
