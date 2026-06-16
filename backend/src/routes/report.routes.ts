import { Router } from 'express';
import { Role } from '@prisma/client';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { ReportQuery, TicketReportQuery } from '../schemas/report.schema';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.SUPPORT_MANAGER, Role.ADMIN));

router.get('/overview', validate({ query: ReportQuery }), reportController.getOverview);
router.get('/tickets', validate({ query: TicketReportQuery }), reportController.getTicketReport);
router.get('/agents', validate({ query: ReportQuery }), reportController.getAgentReport);
router.get('/sla', validate({ query: ReportQuery }), reportController.getSlaReport);
router.get('/escalations', validate({ query: ReportQuery }), reportController.getEscalationReport);

export default router;
