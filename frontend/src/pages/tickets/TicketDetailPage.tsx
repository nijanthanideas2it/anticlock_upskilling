import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTicket, useComments, useCreateComment, useUpdateTicketStatus, useEscalateTicket } from '../../hooks/useTickets';
import { Badge } from '../../components/common/Badge';
import { SlaIndicator } from '../../components/tickets/SlaIndicator';
import { TicketTimeline } from '../../components/tickets/TicketTimeline';
import { CommentBox } from '../../components/tickets/CommentBox';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { isWithinCsatWindow, canReopenTicket } from '../../utils/date';

const SELECT_FIELD = 'form-field';

export function TicketDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: ticket, isLoading, error } = useTicket(id ?? '');
  const { data: commentsData } = useComments(id ?? '');
  const comments = commentsData?.data ?? [];

  const createComment  = useCreateComment();
  const updateStatus   = useUpdateTicketStatus();
  const escalate       = useEscalateTicket();

  const [resolveModal,    setResolveModal]    = useState(false);
  const [escalateModal,   setEscalateModal]   = useState(false);
  const [resolutionNote,  setResolutionNote]  = useState('');
  const [escalateReason,  setEscalateReason]  = useState('');
  const [csatScore,       setCsatScore]       = useState<number | null>(null);

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (error || !ticket) return <ErrorState message={(error as Error)?.message} />;

  const isAgent   = user?.role === 'SUPPORT_AGENT' || user?.role === 'SUPPORT_MANAGER' || user?.role === 'ADMIN';
  const isManager = user?.role === 'SUPPORT_MANAGER' || user?.role === 'ADMIN';

  const canChangeStatus = isAgent && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';

  return (
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/tickets" className="hover:text-blue-500 transition-colors">Tickets</Link>
        <span className="material-symbols-outlined text-gray-300" style={{ fontSize: 16 }}>chevron_right</span>
        <span className="font-mono text-gray-700">{ticket.referenceNumber}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main column ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Ticket header card */}
          <div className="rounded-xl bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ticket.referenceNumber}</span>
              <Badge variant="status"   value={ticket.status}>  {ticket.status.replace('_', ' ')}</Badge>
              <Badge variant="priority" value={ticket.priority}>{ticket.priority}</Badge>
              <SlaIndicator ticket={ticket} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{ticket.title}</h1>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>category</span>
                {ticket.category.name}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span>
                {ticket.assignee?.name ?? 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Conversation</h2>
            <TicketTimeline comments={comments} currentUserId={user?.id} />
          </div>

          {/* Reply box */}
          {ticket.status !== 'CLOSED' && (
            <CommentBox
              onSubmit={async (content, visibility) => {
                await createComment.mutateAsync({ ticketId: ticket.id, body: { content, visibility } });
              }}
              showVisibilityToggle={isAgent}
            />
          )}

          {/* CSAT */}
          {user?.role === 'CUSTOMER' && isWithinCsatWindow(ticket) && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">How did we do?</h3>
                <p className="text-sm text-gray-500 mt-0.5">Rate your support experience</p>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCsatScore(s)}
                    className={`h-10 w-10 rounded-xl text-base font-semibold transition-colors ${
                      csatScore === s
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {csatScore && (
                <Button size="sm" onClick={() => void updateStatus.mutateAsync({ id: ticket.id, body: { status: ticket.status } })}>
                  Submit rating
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar column ─────────────────────────────── */}
        <div className="space-y-4">

          {/* Actions */}
          <div className="rounded-xl bg-white shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

            {canChangeStatus && (
              <div className="space-y-2">
                <select
                  className={SELECT_FIELD}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) void updateStatus.mutateAsync({ id: ticket.id, body: { status: e.target.value } });
                  }}
                >
                  <option value="">Change status…</option>
                  {ticket.status === 'OPEN'        && <option value="IN_PROGRESS">In Progress</option>}
                  {ticket.status === 'OPEN'        && <option value="PENDING">Pending</option>}
                  {ticket.status === 'IN_PROGRESS' && <option value="PENDING">Pending</option>}
                </select>
                <Button className="w-full" onClick={() => setResolveModal(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  Resolve Ticket
                </Button>
              </div>
            )}

            {isManager && (
              <Button variant="danger" size="sm" className="w-full" onClick={() => setEscalateModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                Escalate
              </Button>
            )}

            {user?.role === 'CUSTOMER' && canReopenTicket(ticket) && (
              <Button variant="secondary" className="w-full" onClick={() => void updateStatus.mutateAsync({ id: ticket.id, body: { status: 'OPEN' } })}>
                Reopen Ticket
              </Button>
            )}

            {!canChangeStatus && !isManager && !(user?.role === 'CUSTOMER' && canReopenTicket(ticket)) && (
              <p className="text-xs text-gray-400 text-center py-2">No actions available</p>
            )}
          </div>

          {/* Details */}
          <div className="rounded-xl bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Customer',  value: ticket.customer.primaryContact },
                { label: 'Category',  value: ticket.category.name },
                { label: 'Assignee',  value: ticket.assignee?.name ?? 'Unassigned' },
                { label: 'SLA Policy',value: ticket.slaPolicy?.name ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Resolve modal */}
      <Modal isOpen={resolveModal} onClose={() => setResolveModal(false)} title="Resolve Ticket">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Resolution summary <span className="text-red-500">*</span></label>
            <textarea
              rows={4}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Describe how the issue was resolved…"
              className="form-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setResolveModal(false)}>Cancel</Button>
            <Button
              loading={updateStatus.isPending}
              disabled={!resolutionNote.trim()}
              onClick={() => void updateStatus.mutateAsync({ id: ticket.id, body: { status: 'RESOLVED', resolutionNote } }).then(() => setResolveModal(false))}
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>

      {/* Escalate modal */}
      <Modal isOpen={escalateModal} onClose={() => setEscalateModal(false)} title="Escalate Ticket">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Explain why this ticket needs to be escalated…"
              className="form-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setEscalateModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={escalate.isPending}
              disabled={!escalateReason.trim()}
              onClick={() => void escalate.mutateAsync({ id: ticket.id, reason: escalateReason }).then(() => setEscalateModal(false))}
            >
              Escalate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
