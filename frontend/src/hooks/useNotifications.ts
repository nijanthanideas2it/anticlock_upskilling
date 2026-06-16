import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationService from '../services/notification.service';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30_000,
  });
}

export function useNotifications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.listNotifications(params),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}
