import type { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import * as notificationRepo from '../repositories/notification.repository';

export const listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query['page']) || 1;
    const limit = Number(req.query['limit']) || 20;
    const isRead = req.query['isRead'] !== undefined ? req.query['isRead'] === 'true' : undefined;
    const { data, total, unreadCount } = await notificationService.list(req.user!.id, { isRead, page, limit });
    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount } });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user!.id);
    res.json({ unreadCount });
  } catch (err) { next(err); }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.markAsRead(req.params['id']!, req.user!.id);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) { next(err); }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await notificationService.markAllRead(req.user!.id);
    res.json({ message: 'All notifications marked as read.', updatedCount: result.count });
  } catch (err) { next(err); }
};

export const registerFcmToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationRepo.upsertFcmToken(req.user!.id, (req.body as { fcmToken: string }).fcmToken);
    res.json({ message: 'FCM token registered.' });
  } catch (err) { next(err); }
};
