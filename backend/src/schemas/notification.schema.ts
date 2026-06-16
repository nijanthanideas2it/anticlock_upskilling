import { z } from 'zod';
import { NotificationEvent } from '@prisma/client';

export const UuidParam = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export const ListNotificationsQuery = z.object({
  isRead: z.coerce.boolean().optional(),
  eventType: z.nativeEnum(NotificationEvent).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const RegisterFcmTokenBody = z.object({
  fcmToken: z.string().min(1, 'FCM token is required').max(500),
});

export type RegisterFcmTokenBodyType = z.infer<typeof RegisterFcmTokenBody>;
