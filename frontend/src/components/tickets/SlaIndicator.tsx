import type { TicketDTO } from '../../types';
import { formatSlaDeadline } from '../../utils/date';

export function SlaIndicator({ ticket }: { ticket: TicketDTO }) {
  const { slaStatus, slaResponseDue, slaResolutionDue } = ticket;
  const due = slaResolutionDue ?? slaResponseDue;

  if (!due && !slaStatus) return null;

  const colorMap = {
    WARNING: 'bg-amber-100 text-amber-800 border-amber-200',
    BREACHED: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  };

  const color = slaStatus ? colorMap[slaStatus] : 'bg-green-50 text-green-700 border-green-200';
  const label = slaStatus ?? 'On track';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${slaStatus === 'BREACHED' ? 'bg-red-500' : slaStatus === 'WARNING' ? 'bg-amber-500' : 'bg-green-500'}`} />
      {label}
      {due && <span className="text-xs opacity-75">· {formatSlaDeadline(due)}</span>}
    </span>
  );
}
