import prisma from '../config/database';
import * as ticketRepo from '../repositories/ticket.repository';
import { dispatch } from './notification.service';
import * as userRepo from '../repositories/user.repository';
import type { SlaStatus } from '@prisma/client';

export async function findTicketsNeedingEvaluation() {
  return ticketRepo.findTicketsDueSoon(new Date(), 60);
}

export async function evaluateTicket(ticketId: string) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return;

  const now = new Date();
  let newSlaStatus: SlaStatus | null = ticket.slaStatus ?? null;
  let shouldAutoEscalate = false;

  const responseDue = ticket.slaResponseDue;
  const resolutionDue = ticket.slaResolutionDue;
  const slaPolicy = ticket.slaPolicy as { maxResponseMinutes: number; maxResolutionMinutes: number; warningThreshold: number } | null;

  if (!slaPolicy) return;

  const threshold = slaPolicy.warningThreshold ?? 0.8;
  const responseBreached = responseDue && now > responseDue && !ticket.firstResponseAt;
  const resolutionBreached = resolutionDue && now > resolutionDue;

  if (responseBreached || resolutionBreached) {
    if (newSlaStatus !== 'BREACHED') {
      newSlaStatus = 'BREACHED';
      shouldAutoEscalate = true;
    }
  } else {
    const responseWarning = responseDue && !ticket.firstResponseAt
      && (now.getTime() / responseDue.getTime()) >= threshold;
    const resolutionWarning = resolutionDue
      && (now.getTime() / resolutionDue.getTime()) >= threshold;

    if ((responseWarning || resolutionWarning) && newSlaStatus === null) {
      newSlaStatus = 'WARNING';
    }
  }

  if (newSlaStatus !== ticket.slaStatus) {
    await prisma.ticket.update({ where: { id: ticketId }, data: { slaStatus: newSlaStatus } });

    if (newSlaStatus === 'WARNING') {
      await sendSlaWarningNotifications(ticket);
    }

    if (shouldAutoEscalate) {
      const { autoEscalate } = await import('./escalation.service');
      await autoEscalate(ticketId);
    }
  }
}

async function sendSlaWarningNotifications(ticket: Awaited<ReturnType<typeof ticketRepo.findById>>) {
  if (!ticket) return;

  const recipients: string[] = [];
  if (ticket.assigneeId) recipients.push(ticket.assigneeId);

  const managers = await prisma.user.findMany({
    where: { role: 'SUPPORT_MANAGER', isActive: true, deletedAt: null },
    select: { id: true, email: true },
  });
  managers.forEach((m) => recipients.push(m.id));

  for (const recipientId of [...new Set(recipients)]) {
    const user = await userRepo.findById(recipientId);
    if (!user) continue;
    void dispatch(recipientId, user.email, 'SLA_WARNING', {
      ticketReferenceNumber: ticket.referenceNumber,
      ticketTitle: ticket.title,
      actionUrl: `${process.env['FRONTEND_URL']}/tickets/${ticket.id}`,
    }, ticket.id);
  }
}
