import { Router } from 'express';
import { Role } from '@prisma/client';
import * as configController from '../controllers/config.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { UpdateBusinessHoursBody } from '../schemas/config.schema';

const router = Router();

router.use(authenticate);

router.get('/business-hours', configController.getBusinessHours);

router.put(
  '/business-hours',
  authorize(Role.ADMIN),
  validate({ body: UpdateBusinessHoursBody }),
  configController.updateBusinessHours,
);

export default router;
