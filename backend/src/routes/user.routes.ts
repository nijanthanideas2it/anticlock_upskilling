import { Router } from 'express';
import { Role } from '@prisma/client';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  UuidParam,
  ListUsersQuery,
  CreateUserBody,
  UpdateUserBody,
} from '../schemas/user.schema';
import { ChangePasswordBody } from '../schemas/auth.schema';

const router = Router();

router.use(authenticate);

// Current user
router.get('/me', userController.getMe);
router.patch('/me/password', validate({ body: ChangePasswordBody }), userController.changePassword);

// Admin + Manager — user listing
router.get(
  '/',
  authorize(Role.ADMIN, Role.SUPPORT_MANAGER),
  validate({ query: ListUsersQuery }),
  userController.listUsers,
);

// Admin only — user management
router.post(
  '/',
  authorize(Role.ADMIN),
  validate({ body: CreateUserBody }),
  userController.createUser,
);

router.get(
  '/:id',
  authorize(Role.ADMIN, Role.SUPPORT_MANAGER),
  validate({ params: UuidParam }),
  userController.getUser,
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: UuidParam, body: UpdateUserBody }),
  userController.updateUser,
);

router.patch(
  '/:id/deactivate',
  authorize(Role.ADMIN),
  validate({ params: UuidParam }),
  userController.deactivateUser,
);

router.patch(
  '/:id/activate',
  authorize(Role.ADMIN),
  validate({ params: UuidParam }),
  userController.activateUser,
);

export default router;
