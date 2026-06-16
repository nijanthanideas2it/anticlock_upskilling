import { Router } from 'express';
import authRoutes from './auth.routes';
import ticketRoutes from './ticket.routes';
import userRoutes from './user.routes';
import customerRoutes from './customer.routes';
import categoryRoutes from './category.routes';
import slaRoutes from './sla.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import configRoutes from './config.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/categories', categoryRoutes);
router.use('/sla-policies', slaRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/config', configRoutes);

export default router;
