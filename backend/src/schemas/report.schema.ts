import { z } from 'zod';
import { TicketStatus } from '@prisma/client';

export const ReportQuery = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO datetime' }).optional(),
  to: z.string().datetime({ message: 'to must be a valid ISO datetime' }).optional(),
  agentId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
});

export const TicketReportQuery = ReportQuery.extend({
  groupBy: z.enum(['day', 'week']).default('day'),
});

export type ReportQueryType = z.infer<typeof ReportQuery>;
export type TicketReportQueryType = z.infer<typeof TicketReportQuery>;
