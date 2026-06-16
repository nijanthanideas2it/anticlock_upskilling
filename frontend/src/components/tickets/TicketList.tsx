import type { TicketDTO } from '../../types';
import { TicketCard } from './TicketCard';
import { Skeleton } from '../common/Spinner';
import { EmptyState } from '../common/EmptyState';

interface TicketListProps {
  tickets: TicketDTO[];
  isLoading?: boolean;
  error?: Error | null;
  onClaim?: (id: string) => void;
  onRetry?: () => void;
}

export function TicketList({ tickets, isLoading, error, onClaim, onRetry }: TicketListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">Failed to load tickets. {error.message}</p>
        {onRetry && <button onClick={onRetry} className="mt-2 text-sm text-red-600 underline">Retry</button>}
      </div>
    );
  }

  if (tickets.length === 0) {
    return <EmptyState title="No tickets found" description="No tickets match your current filters." />;
  }

  return (
    <div className="space-y-3">
      {tickets.map((t) => <TicketCard key={t.id} ticket={t} onClaim={onClaim} />)}
    </div>
  );
}
