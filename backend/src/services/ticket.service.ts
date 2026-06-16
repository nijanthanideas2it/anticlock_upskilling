import prisma from '../config/database';
import * as ticketRepo from '../repositories/ticket.repository';
import * as slaRepo from '../repositories/sla.repository';
import * as customerRepo from '../repositories/customer.repository';
import * as userRepo from '../repositories/user.repository';
import { autoAssign } from './assignment.service';
import { dispatch } from './notification.service';
import { writeAuditLog } from '../utils/audit';
import { calculateSlaDeadline } from '../utils/business-hours';
import { generateReferenceNumber } from '../utils/reference-number';
import { AppError } from '../middleware/error.middleware';
import type { TicketStatus, TicketPriority } from '@prisma/client';
import type { TokenPayload } from '../types';
import type { CreateTicketBodyType, ListTicketsQueryType } from '../schemas/ticket.schema';

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING'],
  IN_PROGRESS: ['PENDING', 'RESOLVED'],
  PENDING: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['OPEN'],
  CLOSED: [],
};

const PRIORITY_TIER: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export async function createTicket(actor: TokenPayload, body: CreateTicketBodyType) {
  const { title, description, priority, categoryId } = body;

  const customerId = actor.customerId;
  if (!customerId) throw new AppError(403, 'NOT_CUSTOMER', 'Only customers can submit tickets');

  const [slaPolicy, businessHours] = await Promise.all([
    slaRepo.findByPriority(priority),
    prisma.businessHours.findMany(),
  ]);

  const now = new Date();
  const slaResponseDue = slaPolicy
    ? calculateSlaDeadline(now, slaPolicy.maxResponseMinutes, slaPolicy.businessHoursOnly, businessHours)
    : null;
  const slaResolutionDue = slaPolicy
    ? calculateSlaDeadline(now, slaPolicy.maxResolutionMinutes, slaPolicy.businessHoursOnly, businessHours)
    : null;

  const assigneeId = await autoAssign();
  const referenceNumber = await generateReferenceNumber();

  const ticket = await ticketRepo.create({
    referenceNumber, title, description, priority,
    category: { connect: { id: categoryId } },
    customer: { connect: { id: customerId } },
    createdBy: { connect: { id: actor.id } },
    ...(assigneeId ? { assignee: { connect: { id: assigneeId } } } : {}),
    ...(slaPolicy ? { slaPolicy: { connect: { id: slaPolicy.id } } } : {}),
    slaResponseDue,
    slaResolutionDue,
  });

  const customer = await customerRepo.findByUserId(actor.id);
  if (customer?.user.email) {
    void dispatch(actor.id, customer.user.email, 'TICKET_CREATED', {
      ticketReferenceNumber: referenceNumber, ticketTitle: title,
      actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticket.id}`,
    }, ticket.id);
  }

  if (assigneeId) {
    const agent = await userRepo.findById(assigneeId);
    if (agent) {
      void dispatch(assigneeId, agent.email, 'TICKET_ASSIGNED', {
        ticketReferenceNumber: referenceNumber, ticketTitle: title,
        actorName: 'System',
        actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticket.id}`,
      }, ticket.id);
    }
  }

  return ticket;
}

export async function getTicket(ticketId: string, actor: TokenPayload) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  if (actor.role === 'CUSTOMER' && ticket.customer.userId !== actor.id) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  return ticket;
}

export async function listTickets(actor: TokenPayload, query: ListTicketsQueryType) {
  const { status, priority, slaStatus, assigneeId, categoryId, search, page, limit, sortBy, sortOrder } = query;

  const filters: ticketRepo.ListTicketsFilter = { page, limit, sortBy, sortOrder };

  if (actor.role === 'CUSTOMER') {
    filters.customerId = actor.customerId;
  } else if (actor.role === 'SUPPORT_AGENT') {
    if (assigneeId !== undefined) filters.assigneeId = assigneeId;
  } else {
    if (assigneeId !== undefined) filters.assigneeId = assigneeId;
  }

  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (slaStatus) filters.slaStatus = slaStatus;
  if (categoryId) filters.categoryId = categoryId;
  if (search) filters.search = search;

  return ticketRepo.listWithFilters(filters);
}

export async function updateStatus(
  ticketId: string,
  newStatus: TicketStatus,
  actor: TokenPayload,
  resolutionNote?: string,
) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  if (actor.role === 'SUPPORT_AGENT' && ticket.assigneeId !== actor.id) {
    throw new AppError(403, 'FORBIDDEN', 'Can only update tickets assigned to you');
  }

  const allowed = VALID_TRANSITIONS[ticket.status];
  if (!allowed.includes(newStatus)) {
    throw new AppError(400, 'INVALID_TRANSITION', `Cannot transition from ${ticket.status} to ${newStatus}`);
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'RESOLVED') {
    updateData.resolvedAt = now;
    updateData.slaStatus = null;
    updateData.csatWindowExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({ where: { id: ticketId }, data: updateData });
    await writeAuditLog(tx as never, ticketId, actor.id, 'status', ticket.status, newStatus);
    if (resolutionNote) await writeAuditLog(tx as never, ticketId, actor.id, 'resolutionNote', null, resolutionNote);
    return t;
  });

  const actorUser = await userRepo.findById(actor.id);
  const actorName = actorUser?.name ?? 'Agent';

  if (newStatus === 'RESOLVED' && ticket.customer) {
    const customerUser = await userRepo.findById(ticket.customer.userId as string);
    if (customerUser) {
      void dispatch(customerUser.id, customerUser.email, 'TICKET_RESOLVED', {
        ticketReferenceNumber: ticket.referenceNumber,
        ticketTitle: ticket.title,
        message: resolutionNote,
        actorName,
        actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
      }, ticketId);
      void dispatch(customerUser.id, customerUser.email, 'CSAT_REQUEST', {
        ticketReferenceNumber: ticket.referenceNumber,
        ticketTitle: ticket.title,
        actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
      }, ticketId);
    }
  }

  return updated;
}

export async function claimTicket(ticketId: string, actor: TokenPayload) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');
  if (ticket.assigneeId) throw new AppError(409, 'ALREADY_ASSIGNED', 'Ticket already assigned');

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({ where: { id: ticketId }, data: { assigneeId: actor.id } });
    await writeAuditLog(tx as never, ticketId, actor.id, 'assigneeId', null, actor.id);
    return t;
  });

  const customerUser = ticket.customer
    ? await userRepo.findById(ticket.customer.userId as string)
    : null;

  const actorUser = await userRepo.findById(actor.id);

  if (customerUser) {
    void dispatch(customerUser.id, customerUser.email, 'TICKET_ASSIGNED', {
      ticketReferenceNumber: ticket.referenceNumber,
      actorName: actorUser?.name ?? 'Agent',
      actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
    }, ticketId);
  }

  return updated;
}

export async function assignTicket(ticketId: string, assigneeId: string, actor: TokenPayload) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  const agent = await userRepo.findById(assigneeId);
  if (!agent || !agent.isActive) throw new AppError(400, 'INVALID_AGENT', 'Agent not found or inactive');

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({ where: { id: ticketId }, data: { assigneeId } });
    await writeAuditLog(tx as never, ticketId, actor.id, 'assigneeId', ticket.assigneeId, assigneeId);
    return t;
  });

  void dispatch(assigneeId, agent.email, 'TICKET_ASSIGNED', {
    ticketReferenceNumber: ticket.referenceNumber,
    ticketTitle: ticket.title,
    actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
  }, ticketId);

  return updated;
}

export async function submitCsat(ticketId: string, actor: TokenPayload, score: number, comment?: string) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  if (ticket.customer.userId as string !== actor.id) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }
  if (ticket.status !== 'RESOLVED') throw new AppError(400, 'NOT_RESOLVED', 'Ticket is not resolved');
  if (ticket.csatSubmittedAt) throw new AppError(409, 'ALREADY_RATED', 'CSAT already submitted');
  if (ticket.csatWindowExpiresAt && ticket.csatWindowExpiresAt < new Date()) {
    throw new AppError(400, 'WINDOW_EXPIRED', 'CSAT rating window has expired');
  }

  return ticketRepo.update(ticketId, { csatScore: score, csatComment: comment, csatSubmittedAt: new Date() });
}

export async function raisePriority(currentPriority: TicketPriority): Promise<TicketPriority> {
  const idx = PRIORITY_TIER.indexOf(currentPriority);
  return idx < PRIORITY_TIER.length - 1
    ? PRIORITY_TIER[idx + 1] as TicketPriority
    : currentPriority;
}
