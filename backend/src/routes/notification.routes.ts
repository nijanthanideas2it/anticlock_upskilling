import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  UuidParam,
  ListNotificationsQuery,
  RegisterFcmTokenBody,
} from '../schemas/notification.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: ListNotificationsQuery }), notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate({ params: UuidParam }), notificationController.markAsRead);
router.post('/fcm-token', validate({ body: RegisterFcmTokenBody }), notificationController.registerFcmToken);

export default router;
