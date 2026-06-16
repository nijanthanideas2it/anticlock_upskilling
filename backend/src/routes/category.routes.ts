import { Router } from 'express';
import { Role } from '@prisma/client';
import * as categoryController from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  UuidParam,
  CreateCategoryBody,
  UpdateCategoryBody,
} from '../schemas/category.schema';

const router = Router();

router.use(authenticate);

// All authenticated users can list categories
router.get('/', categoryController.listCategories);

// Admin only — category management
router.post(
  '/',
  authorize(Role.ADMIN),
  validate({ body: CreateCategoryBody }),
  categoryController.createCategory,
);

router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: UuidParam, body: UpdateCategoryBody }),
  categoryController.updateCategory,
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate({ params: UuidParam }),
  categoryController.deleteCategory,
);

export default router;
