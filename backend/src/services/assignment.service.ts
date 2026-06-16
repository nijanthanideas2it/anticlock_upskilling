import { findLeastLoadedAgent } from '../utils/round-robin';
import * as ticketRepo from '../repositories/ticket.repository';

export async function autoAssign(): Promise<string | null> {
  return findLeastLoadedAgent();
}

export async function claimTicket(ticketId: string, agentId: string) {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  if (ticket.assigneeId) throw new Error('ALREADY_ASSIGNED');
  return ticketRepo.update(ticketId, { assignee: { connect: { id: agentId } } });
}
