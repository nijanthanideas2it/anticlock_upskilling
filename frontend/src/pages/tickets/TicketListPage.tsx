import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTickets, useClaimTicket } from '../../hooks/useTickets';
import { TicketList } from '../../components/tickets/TicketList';
import { Button } from '../../components/common/Button';

type Tab = 'mine' | 'unassigned' | 'all';

export function TicketListPage() {
  const { user }     = useAuth();
  const [tab, setTab] = useState<Tab>('mine');
  const claimTicket  = useClaimTicket();

  const queryParams: Record<string, unknown> = {};
  if (user?.role === 'SUPPORT_AGENT') {
    if (tab === 'mine')       queryParams.assigneeId = user.id;
    if (tab === 'unassigned') queryParams.assigneeId = null;
  }

  const { data, isLoading, error, refetch } = useTickets(queryParams);
  const tickets = data?.data ?? [];

  const tabs: { key: Tab; label: string }[] =
    user?.role === 'SUPPORT_AGENT'
      ? [{ key: 'mine', label: 'My Queue' }, { key: 'unassigned', label: 'Unassigned' }]
      : user?.role === 'SUPPORT_MANAGER' || user?.role === 'ADMIN'
      ? [{ key: 'mine', label: 'My Queue' }, { key: 'unassigned', label: 'Unassigned' }, { key: 'all', label: 'All Tickets' }]
      : [];

  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isCustomer ? 'My Tickets' : 'Ticket Queue'}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {tickets.length > 0 ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}` : 'No tickets'}
          </p>
        </div>
        {isCustomer && (
          <Link to="/tickets/new">
            <Button>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              New Ticket
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="flex border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        error={error}
        onClaim={tab === 'unassigned' ? (id) => void claimTicket.mutateAsync(id) : undefined}
        onRetry={() => void refetch()}
      />
    </div>
  );
}
