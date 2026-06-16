import { Router } from 'express';
import { Role } from '@prisma/client';
import * as ticketController from '../controllers/ticket.controller';
import * as commentController from '../controllers/comment.controller';
import * as attachmentController from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  UuidParam,
  ListTicketsQuery,
  CreateTicketBody,
  UpdateTicketStatusBody,
  AssignTicketBody,
  EscalateTicketBody,
  SubmitCsatBody,
} from '../schemas/ticket.schema';
import {
  TicketIdParam,
  CommentParams,
  CreateCommentBody,
  ListCommentsQuery,
} from '../schemas/comment.schema';
import {
  TicketAttachmentParams,
  AttachmentParams,
  PresignAttachmentBody,
  ConfirmAttachmentBody,
} from '../schemas/attachment.schema';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// ─── Tickets ─────────────────────────────────────────────────────────────────

router.get(
  '/',
  validate({ query: ListTicketsQuery }),
  ticketController.listTickets,
);

router.post(
  '/',
  authorize(Role.CUSTOMER, Role.ADMIN),
  validate({ body: CreateTicketBody }),
  ticketController.createTicket,
);

router.get(
  '/:id',
  validate({ params: UuidParam }),
  ticketController.getTicket,
);

router.patch(
  '/:id/status',
  authorize(Role.SUPPORT_AGENT, Role.SUPPORT_MANAGER, Role.ADMIN),
  validate({ params: UuidParam, body: UpdateTicketStatusBody }),
  ticketController.updateStatus,
);

router.patch(
  '/:id/assign',
  authorize(Role.SUPPORT_MANAGER, Role.ADMIN),
  validate({ params: UuidParam, body: AssignTicketBody }),
  ticketController.assignTicket,
);

router.patch(
  '/:id/claim',
  authorize(Role.SUPPORT_AGENT),
  validate({ params: UuidParam }),
  ticketController.claimTicket,
);

router.post(
  '/:id/escalate',
  authorize(Role.SUPPORT_MANAGER, Role.ADMIN),
  validate({ params: UuidParam, body: EscalateTicketBody }),
  ticketController.escalateTicket,
);

router.post(
  '/:id/csat',
  authorize(Role.CUSTOMER),
  validate({ params: UuidParam, body: SubmitCsatBody }),
  ticketController.submitCsat,
);

router.get(
  '/:id/audit',
  authorize(Role.SUPPORT_MANAGER, Role.ADMIN),
  validate({ params: UuidParam }),
  ticketController.getAuditLog,
);

// ─── Comments ────────────────────────────────────────────────────────────────

router.get(
  '/:ticketId/comments',
  validate({ params: TicketIdParam, query: ListCommentsQuery }),
  commentController.listComments,
);

router.post(
  '/:ticketId/comments',
  validate({ params: TicketIdParam, body: CreateCommentBody }),
  commentController.createComment,
);

router.delete(
  '/:ticketId/comments/:id',
  validate({ params: CommentParams }),
  commentController.deleteComment,
);

// ─── Attachments ─────────────────────────────────────────────────────────────

router.post(
  '/:ticketId/attachments/presign',
  validate({ params: TicketAttachmentParams, body: PresignAttachmentBody }),
  attachmentController.presignUpload,
);

router.post(
  '/:ticketId/attachments/confirm',
  validate({ params: TicketAttachmentParams, body: ConfirmAttachmentBody }),
  attachmentController.confirmUpload,
);

router.delete(
  '/:ticketId/attachments/:id',
  validate({ params: AttachmentParams }),
  attachmentController.deleteAttachment,
);

export default router;
