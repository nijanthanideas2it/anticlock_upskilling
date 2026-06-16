import { Router } from 'express';
import { Role } from '@prisma/client';
import * as customerController from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  UuidParam,
  ListCustomersQuery,
  CreateCustomerBody,
  UpdateCustomerBody,
} from '../schemas/customer.schema';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.SUPPORT_MANAGER));

router.get('/', validate({ query: ListCustomersQuery }), customerController.listCustomers);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate({ body: CreateCustomerBody }),
  customerController.createCustomer,
);

router.get('/:id', validate({ params: UuidParam }), customerController.getCustomer);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: UuidParam, body: UpdateCustomerBody }),
  customerController.updateCustomer,
);

export default router;
