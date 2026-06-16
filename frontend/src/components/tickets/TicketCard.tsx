import { Link } from 'react-router-dom';
import type { TicketDTO } from '../../types';
import { Badge } from '../common/Badge';
import { SlaIndicator } from './SlaIndicator';
import { formatRelativeTime } from '../../utils/date';

export function TicketCard({ ticket, onClaim }: { ticket: TicketDTO; onClaim?: (id: string) => void }) {
  const leftBorder =
    ticket.slaStatus === 'BREACHED' ? 'border-l-4 border-l-red-500'  :
    ticket.slaStatus === 'WARNING'  ? 'border-l-4 border-l-amber-400' : '';

  return (
    <div className={`flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow ${leftBorder}`}>
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">{ticket.referenceNumber}</span>
          <Badge variant="status"   value={ticket.status}>  {ticket.status.replace('_', ' ')}</Badge>
          <Badge variant="priority" value={ticket.priority}>{ticket.priority}</Badge>
        </div>

        {/* Title */}
        <Link
          to={`/tickets/${ticket.id}`}
          className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate transition-colors"
        >
          {ticket.title}
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <SlaIndicator ticket={ticket} />
          {ticket.assignee && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span>
              {ticket.assignee.name}
            </span>
          )}
          <span className="text-xs text-gray-400">{formatRelativeTime(ticket.createdAt)}</span>
        </div>
      </div>

      {onClaim && !ticket.assignee && (
        <button
          onClick={() => onClaim(ticket.id)}
          className="ml-4 shrink-0 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          Claim
        </button>
      )}
    </div>
  );
}
