import api from './api';
import type { NotificationDTO, PaginatedResponse } from '../types';

export async function listNotifications(params?: Record<string, unknown>): Promise<PaginatedResponse<NotificationDTO> & { meta: { unreadCount: number } }> {
  const res = await api.get('/notifications', { params });
  return res.data as PaginatedResponse<NotificationDTO> & { meta: { unreadCount: number } };
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
  return res.data.unreadCount;
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function registerFcmToken(fcmToken: string): Promise<void> {
  await api.post('/notifications/fcm-token', { fcmToken });
}
