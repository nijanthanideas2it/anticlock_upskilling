import { formatDistanceToNow, parseISO, isAfter } from 'date-fns';
import type { TicketDTO } from '../types';

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

export function isSlaWarning(ticket: TicketDTO): boolean {
  return ticket.slaStatus === 'WARNING';
}

export function isSlaBreached(ticket: TicketDTO): boolean {
  return ticket.slaStatus === 'BREACHED';
}

export function canReopenTicket(ticket: TicketDTO): boolean {
  if (ticket.status !== 'RESOLVED') return false;
  if (!ticket.csatWindowExpiresAt) return false;
  return isAfter(parseISO(ticket.csatWindowExpiresAt), new Date());
}

export function isWithinCsatWindow(ticket: TicketDTO): boolean {
  if (ticket.status !== 'RESOLVED' || ticket.csatSubmittedAt) return false;
  if (!ticket.csatWindowExpiresAt) return false;
  return isAfter(parseISO(ticket.csatWindowExpiresAt), new Date());
}

export function formatSlaDeadline(iso: string | null): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (isAfter(new Date(), d)) return `Breached ${formatDistanceToNow(d, { addSuffix: true })}`;
  return `Due ${formatDistanceToNow(d, { addSuffix: true })}`;
}
