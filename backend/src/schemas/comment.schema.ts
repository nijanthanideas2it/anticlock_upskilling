import { z } from 'zod';
import { CommentVisibility } from '@prisma/client';

export const TicketIdParam = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
});

export const CommentParams = z.object({
  ticketId: z.string().uuid('Invalid ticket ID'),
  id: z.string().uuid('Invalid comment ID'),
});

export const CreateCommentBody = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  visibility: z.nativeEnum(CommentVisibility).default(CommentVisibility.PUBLIC),
  attachmentIds: z.array(z.string().uuid()).max(5).optional(),
});

export const ListCommentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateCommentBodyType = z.infer<typeof CreateCommentBody>;
