import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@prisma/client';

export const UuidParam = z.object({
  id: z.string().uuid('Invalid ticket ID'),
});

export const ListTicketsQuery = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  slaStatus: z.enum(['WARNING', 'BREACHED']).optional(),
  assigneeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['slaResponseDue', 'createdAt', 'updatedAt', 'priority'])
    .default('slaResponseDue'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const CreateTicketBody = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  priority: z.nativeEnum(TicketPriority),
  categoryId: z.string().uuid('Invalid category ID'),
});

export const UpdateTicketStatusBody = z.object({
  status: z.nativeEnum(TicketStatus),
  resolutionNote: z.string().min(10).max(2000).optional(),
});

export const AssignTicketBody = z.object({
  assigneeId: z.string().uuid('Invalid agent ID'),
});

export const EscalateTicketBody = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export const SubmitCsatBody = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateTicketBodyType = z.infer<typeof CreateTicketBody>;
export type UpdateTicketStatusBodyType = z.infer<typeof UpdateTicketStatusBody>;
export type ListTicketsQueryType = z.infer<typeof ListTicketsQuery>;
