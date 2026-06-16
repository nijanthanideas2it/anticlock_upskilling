import prisma from '../config/database';
import * as ticketRepo from '../repositories/ticket.repository';
import * as userRepo from '../repositories/user.repository';
import { dispatch } from './notification.service';
import { raisePriority } from './ticket.service';
import { writeAuditLog } from '../utils/audit';
import { AppError } from '../middleware/error.middleware';
import type { TokenPayload } from '../types';

async function findEscalationRecipient(): Promise<string | null> {
  const manager = await prisma.user.findFirst({
    where: { role: 'SUPPORT_MANAGER', isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (manager) return manager.id;

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', isActive: true, deletedAt: null },
    select: { id: true },
  });
  return admin?.id ?? null;
}

export async function autoEscalate(ticketId: string) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) return;

  const recipientId = await findEscalationRecipient();
  if (!recipientId) return;

  await prisma.escalationEvent.create({
    data: {
      type: 'AUTO',
      reason: 'Automatic SLA breach',
      ticket: { connect: { id: ticketId } },
      escalatedTo: { connect: { id: recipientId } },
    },
  });

  const recipient = await userRepo.findById(recipientId);
  if (recipient) {
    void dispatch(recipientId, recipient.email, 'SLA_BREACHED', {
      ticketReferenceNumber: ticket.referenceNumber,
      ticketTitle: ticket.title,
      actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
    }, ticketId);
    void dispatch(recipientId, recipient.email, 'TICKET_ESCALATED', {
      ticketReferenceNumber: ticket.referenceNumber,
      ticketTitle: ticket.title,
      actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
    }, ticketId);
  }

  if (ticket.assigneeId) {
    const agent = await userRepo.findById(ticket.assigneeId);
    if (agent) {
      void dispatch(agent.id, agent.email, 'SLA_BREACHED', {
        ticketReferenceNumber: ticket.referenceNumber,
        ticketTitle: ticket.title,
        actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
      }, ticketId);
    }
  }
}

export async function manualEscalate(ticketId: string, reason: string, actor: TokenPayload) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'Ticket not found');

  const recipientId = await findEscalationRecipient();
  if (!recipientId) throw new AppError(500, 'NO_ESCALATION_TARGET', 'No escalation recipient found');

  const newPriority = await raisePriority(ticket.priority);

  await prisma.$transaction(async (tx) => {
    await tx.escalationEvent.create({
      data: {
        type: 'MANUAL',
        reason,
        ticket: { connect: { id: ticketId } },
        escalatedBy: { connect: { id: actor.id } },
        escalatedTo: { connect: { id: recipientId } },
      },
    });
    await tx.ticket.update({ where: { id: ticketId }, data: { priority: newPriority } });
    await writeAuditLog(tx as never, ticketId, actor.id, 'priority', ticket.priority, newPriority);
    await writeAuditLog(tx as never, ticketId, actor.id, 'escalation', null, `Manual: ${reason}`);
  });

  const actorUser = await userRepo.findById(actor.id);
  if (ticket.assigneeId) {
    const agent = await userRepo.findById(ticket.assigneeId);
    if (agent) {
      void dispatch(agent.id, agent.email, 'TICKET_ESCALATED', {
        ticketReferenceNumber: ticket.referenceNumber,
        ticketTitle: ticket.title,
        actorName: actorUser?.name ?? 'Manager',
        message: reason,
        actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticketId}`,
      }, ticketId);
    }
  }

  return ticketRepo.findById(ticketId);
}
