import prisma from '../config/database';
import * as commentRepo from '../repositories/comment.repository';
import * as ticketRepo from '../repositories/ticket.repository';
import * as userRepo from '../repositories/user.repository';
import { dispatch } from './notification.service';
import { writeAuditLog } from '../utils/audit';
import { AppError } from '../middleware/error.middleware';
import type { CommentVisibility, Role } from '@prisma/client';
import type { TokenPayload } from '../types';
import type { CreateCommentBodyType } from '../schemas/comment.schema';

const CUSTOMER_ROLES: Role[] = ['CUSTOMER'];
const AGENT_ROLES: Role[] = ['SUPPORT_AGENT', 'SUPPORT_MANAGER', 'ADMIN'];

export async function createComment(
  ticketId: string,
  actor: TokenPayload,
  body: CreateCommentBodyType,
) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  if (actor.role === 'CUSTOMER') {
    if (ticket.customer.userId as string !== actor.id) throw new AppError(403, 'FORBIDDEN', 'Access denied');
    if (body.visibility === 'INTERNAL') {
      throw new AppError(400, 'FORBIDDEN', 'Customers cannot create internal notes');
    }
  }

  const comment = await commentRepo.create({
    content: body.content,
    visibility: body.visibility as CommentVisibility,
    ticket: { connect: { id: ticketId } },
    author: { connect: { id: actor.id } },
  });

  const isAgentReply = AGENT_ROLES.includes(actor.role as Role) && body.visibility !== 'INTERNAL';

  if (isAgentReply && !ticket.firstResponseAt) {
    await prisma.ticket.update({ where: { id: ticketId }, data: { firstResponseAt: new Date() } });
    await writeAuditLog(prisma as never, ticketId, actor.id, 'firstResponseAt', null, new Date().toISOString());
  }

  const actorUser = await userRepo.findById(actor.id);

  if (body.visibility !== 'INTERNAL') {
    if (isAgentReply && ticket.customer) {
      const customerUser = await userRepo.findById(ticket.customer.userId as string);
      if (customerUser) {
        void dispatch(customerUser.id, customerUser.email, 'TICKET_REPLY', {
          ticketReferenceNumber: ticket.referenceNumber,
          ticketTitle: ticket.title,
          actorName: actorUser?.name ?? 'Agent',
          message: body.content.substring(0, 200),
          actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
        }, ticketId);
      }
    } else if (actor.role === 'CUSTOMER' && ticket.assigneeId) {
      const agent = await userRepo.findById(ticket.assigneeId);
      if (agent) {
        void dispatch(agent.id, agent.email, 'TICKET_REPLY', {
          ticketReferenceNumber: ticket.referenceNumber,
          ticketTitle: ticket.title,
          actorName: actorUser?.name ?? 'Customer',
          message: body.content.substring(0, 200),
          actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
        }, ticketId);
      }
    }
  }

  return comment;
}

export async function listComments(
  ticketId: string,
  actor: TokenPayload,
  page: number,
  limit: number,
) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  if (actor.role === 'CUSTOMER' && ticket.customer.userId as string !== actor.id) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  const visibilityFilter =
    CUSTOMER_ROLES.includes(actor.role as Role) ? (['PUBLIC'] as CommentVisibility[]) : undefined;

  return commentRepo.findByTicketId(ticketId, visibilityFilter, page, limit);
}

export async function deleteComment(commentId: string, actor: TokenPayload) {
  const comment = await commentRepo.findById(commentId);
  if (!comment) throw new AppError(404, 'NOT_FOUND', 'Comment not found');
  if (comment.authorId !== actor.id && actor.role !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Only the author can delete a comment');
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (actor.role !== 'ADMIN' && comment.createdAt < fiveMinAgo) {
    throw new AppError(400, 'WINDOW_EXPIRED', 'Comments can only be deleted within 5 minutes of creation');
  }

  return commentRepo.softDelete(commentId);
}
