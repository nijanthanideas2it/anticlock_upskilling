import { Router } from 'express';
import { Role } from '@prisma/client';
import * as slaController from '../controllers/sla.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  UuidParam,
  CreateSlaPolicyBody,
  UpdateSlaPolicyBody,
} from '../schemas/sla.schema';

const router = Router();

router.use(authenticate);

// All authenticated users can list SLA policies
router.get('/', slaController.listSlaPolicies);

// Admin only — SLA policy management
router.post(
  '/',
  authorize(Role.ADMIN),
  validate({ body: CreateSlaPolicyBody }),
  slaController.createSlaPolicy,
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: UuidParam, body: UpdateSlaPolicyBody }),
  slaController.updateSlaPolicy,
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: UuidParam }),
  slaController.deleteSlaPolicy,
);

export default router;
