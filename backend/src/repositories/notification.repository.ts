import prisma from '../config/database';
import type { NotificationChannel, NotificationEvent, Prisma } from '@prisma/client';

export async function create(data: {
  recipientId: string;
  channel: NotificationChannel;
  eventType: NotificationEvent;
  payload: Record<string, unknown>;
  ticketId?: string;
}) {
  return prisma.notification.create({ data: { ...data, payload: data.payload as Prisma.InputJsonValue } });
}

export async function listByRecipient(
  recipientId: string,
  filters: { isRead?: boolean; page: number; limit: number },
) {
  const where: Prisma.NotificationWhereInput = { recipientId };
  if (filters.isRead !== undefined) where.isRead = filters.isRead;

  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
      include: { ticket: { select: { id: true, referenceNumber: true } } },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipientId, isRead: false } }),
  ]);

  return { data, total, unreadCount };
}

export async function countUnread(recipientId: string) {
  return prisma.notification.count({ where: { recipientId, isRead: false } });
}

export async function markAsRead(id: string, recipientId: string) {
  return prisma.notification.updateMany({
    where: { id, recipientId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(recipientId: string) {
  return prisma.notification.updateMany({
    where: { recipientId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function upsertFcmToken(userId: string, token: string) {
  return prisma.fcmToken.upsert({
    where: { token },
    update: { userId },
    create: { userId, token },
  });
}

export async function getFcmTokensForUser(userId: string) {
  return prisma.fcmToken.findMany({ where: { userId }, select: { token: true } });
}
