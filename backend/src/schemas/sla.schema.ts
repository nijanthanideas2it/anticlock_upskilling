import { z } from 'zod';
import { TicketPriority } from '@prisma/client';

export const UuidParam = z.object({
  id: z.string().uuid('Invalid SLA policy ID'),
});

export const CreateSlaPolicyBody = z
  .object({
    name: z.string().min(3).max(100),
    priority: z.nativeEnum(TicketPriority),
    maxResponseMinutes: z.number().int().min(1),
    maxResolutionMinutes: z.number().int().min(1),
    businessHoursOnly: z.boolean().default(false),
    warningThreshold: z.number().min(0.5).max(0.95).default(0.8),
  })
  .refine((d) => d.maxResolutionMinutes > d.maxResponseMinutes, {
    message: 'Resolution time must be greater than response time',
    path: ['maxResolutionMinutes'],
  });

export const UpdateSlaPolicyBody = z
  .object({
    name: z.string().min(3).max(100).optional(),
    maxResponseMinutes: z.number().int().min(1).optional(),
    maxResolutionMinutes: z.number().int().min(1).optional(),
    businessHoursOnly: z.boolean().optional(),
    warningThreshold: z.number().min(0.5).max(0.95).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.maxResolutionMinutes === undefined ||
      d.maxResponseMinutes === undefined ||
      d.maxResolutionMinutes > d.maxResponseMinutes,
    {
      message: 'Resolution time must be greater than response time',
      path: ['maxResolutionMinutes'],
    },
  );

export type CreateSlaPolicyBodyType = z.infer<typeof CreateSlaPolicyBody>;
export type UpdateSlaPolicyBodyType = z.infer<typeof UpdateSlaPolicyBody>;
