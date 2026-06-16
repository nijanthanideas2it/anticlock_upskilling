import type { NotificationEvent } from '@prisma/client';
import * as notificationRepo from '../repositories/notification.repository';
import { sendEmail } from '../notifications/email.provider';
import { sendPush } from '../notifications/push.provider';

export interface NotificationPayload {
  ticketReferenceNumber?: string;
  ticketTitle?: string;
  actorName?: string;
  message?: string;
  actionUrl?: string;
  [key: string]: unknown;
}

export async function dispatch(
  recipientId: string,
  recipientEmail: string,
  eventType: NotificationEvent,
  payload: NotificationPayload,
  ticketId?: string,
): Promise<void> {
  await notificationRepo.create({
    recipientId,
    channel: 'IN_APP',
    eventType,
    payload: payload as Record<string, unknown>,
    ticketId,
  });

  void (async () => {
    try {
      await sendEmail(recipientEmail, eventType, payload);
    } catch (err) {
      console.error('[notification.service] email error:', err);
    }
  })();

  void (async () => {
    try {
      const tokens = await notificationRepo.getFcmTokensForUser(recipientId);
      const title = payload.ticketReferenceNumber
        ? `[${payload.ticketReferenceNumber}] ${eventType}`
        : eventType;
      const body = payload.message ?? payload.ticketTitle ?? '';
      await Promise.all(tokens.map((t) => sendPush(t.token, title, body)));
    } catch (err) {
      console.error('[notification.service] push error:', err);
    }
  })();
}

export async function markAsRead(id: string, userId: string) {
  return notificationRepo.markAsRead(id, userId);
}

export async function markAllRead(userId: string) {
  return notificationRepo.markAllRead(userId);
}

export async function getUnreadCount(userId: string) {
  return notificationRepo.countUnread(userId);
}

export async function list(
  userId: string,
  filters: { isRead?: boolean; page: number; limit: number },
) {
  return notificationRepo.listByRecipient(userId, filters);
}
