import { z } from 'zod';

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const BusinessHoursEntry = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timePattern, 'Time must be in HH:mm format'),
  endTime: z.string().regex(timePattern, 'Time must be in HH:mm format'),
  isActive: z.boolean(),
});

export const UpdateBusinessHoursBody = z
  .object({
    timezone: z.string().min(1).max(100),
    schedule: z.array(BusinessHoursEntry).length(7, 'All 7 days must be provided'),
  })
  .refine(
    (d) =>
      d.schedule.every(
        (entry) => !entry.isActive || entry.startTime < entry.endTime,
      ),
    { message: 'startTime must be before endTime for active days' },
  );

export type UpdateBusinessHoursBodyType = z.infer<typeof UpdateBusinessHoursBody>;
