import type { ReactNode } from 'react';
import type { TicketStatus, TicketPriority, SlaStatus } from '../../types';

type BadgeVariant = 'status' | 'priority' | 'sla' | 'role';

const statusColors: Record<TicketStatus, string> = {
  OPEN:        'bg-blue-50  text-blue-700',
  IN_PROGRESS: 'bg-teal-50  text-teal-700',
  PENDING:     'bg-amber-50 text-amber-700',
  RESOLVED:    'bg-green-50 text-green-600',
  CLOSED:      'bg-gray-100 text-gray-500',
};

const priorityColors: Record<TicketPriority, string> = {
  LOW:      'bg-gray-100   text-gray-600',
  MEDIUM:   'bg-blue-50    text-blue-600',
  HIGH:     'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-red-100    text-red-600',
};

const slaColors: Record<SlaStatus, string> = {
  WARNING:  'bg-amber-100 text-amber-700',
  BREACHED: 'bg-red-100   text-red-600   animate-pulse',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  value?: string;
}

export function Badge({ children, variant, value }: BadgeProps) {
  let color = 'bg-gray-100 text-gray-600';
  if (variant === 'status'   && value) color = statusColors[value as TicketStatus]     ?? color;
  if (variant === 'priority' && value) color = priorityColors[value as TicketPriority] ?? color;
  if (variant === 'sla'      && value) color = slaColors[value as SlaStatus]           ?? color;
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${color}`}>
      {children}
    </span>
  );
}
