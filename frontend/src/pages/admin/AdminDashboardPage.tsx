import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, ResponsiveContainer, Area, Tooltip } from 'recharts';
import { useOverview, useTicketSeries, useSlaReport } from '../../hooks/useReports';
import { useTickets } from '../../hooks/useTickets';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../../components/common/Spinner';
import type { TicketDTO, TicketPriority, TicketStatus } from '../../types';

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  LOW:      'bg-gray-100   text-gray-600',
  MEDIUM:   'bg-blue-50    text-blue-600',
  HIGH:     'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-red-100    text-red-600',
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  OPEN:        'bg-blue-50  text-blue-700',
  IN_PROGRESS: 'bg-teal-50  text-teal-700',
  PENDING:     'bg-amber-50 text-amber-700',
  RESOLVED:    'bg-green-50 text-green-600',
  CLOSED:      'bg-gray-100 text-gray-500',
};

/* ── Metric card ───────────────────────────────────── */

function MetricCard({ label, value, trend, trendUp, icon, loading }: {
  label: string; value: string | number; trend: string;
  trendUp: boolean; icon: string; loading?: boolean;
}): React.ReactElement {
  return (
    <div className="rounded-xl bg-white shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
        <span
          className="material-symbols-outlined text-blue-500"
          style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      {loading ? (
        <Skeleton className="h-10 w-20 mt-1" />
      ) : (
        <span className="text-4xl font-bold text-gray-900 tracking-tight">{value}</span>
      )}

      <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {trendUp ? 'trending_up' : 'trending_down'}
        </span>
        {trend}
      </div>
    </div>
  );
}

/* ── Data shapes ──────────────────────────────────── */
type OvShape     = { totalTickets?: number; openTickets?: number; avgCsatScore?: number | null };
type SlaShape    = { overall?: { complianceRate: number } };
type SeriesShape = { series?: { date: string; created: number; resolved: number }[] };

/* ── Page ─────────────────────────────────────────── */

export function AdminDashboardPage(): React.ReactElement {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const { data: overview,     isLoading: ovLoading }      = useOverview();
  const { data: series }                                   = useTicketSeries({ groupBy: 'day' });
  const { data: sla }                                      = useSlaReport();
  const { data: ticketsData, isLoading: ticketsLoading, error: ticketsError } = useTickets();

  const ov             = overview as OvShape | undefined;
  const slaData        = sla as SlaShape | undefined;
  const seriesData     = (series as SeriesShape)?.series ?? [];
  const recentTickets: TicketDTO[] = (ticketsData?.data ?? []).slice(0, 5);

  const openTickets    = ov?.openTickets    ?? 0;
  const totalTickets   = ov?.totalTickets   ?? 0;
  const csatScore      = ov?.avgCsatScore;
  const complianceRate = slaData?.overall?.complianceRate;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Hero ─────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name ?? 'Admin'}.</h2>
        <p className="mt-1 text-sm text-gray-500">Here's your service desk at a glance.</p>
      </section>

      {/* ── Metric cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Open Tickets"    value={openTickets}  trend="+12% from yesterday" trendUp={false} icon="confirmation_number" loading={ovLoading} />
        <MetricCard label="Total Tickets"   value={totalTickets} trend="Stable"               trendUp={true}  icon="assignment_turned_in" loading={ovLoading} />
        <MetricCard
          label="SLA Compliance"
          value={complianceRate != null ? `${Math.round(complianceRate * 100)}%` : '—'}
          trend="On track" trendUp={true} icon="check_circle" loading={ovLoading}
        />
        <MetricCard
          label="Avg CSAT Score"
          value={csatScore != null ? `${csatScore.toFixed(1)}/5` : '—'}
          trend="Improving" trendUp={true} icon="star" loading={ovLoading}
        />
      </div>

      {/* ── Bento grid ───────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Recent Tickets — 8 cols */}
        <div className="col-span-12 lg:col-span-8 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Recent Tickets</h3>
            <Link to="/tickets" className="flex items-center gap-0.5 text-xs font-semibold text-blue-500 hover:text-blue-600">
              View all
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </Link>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="table-header border-b border-gray-100">
                {['Ticket', 'Priority', 'Status', 'Assignee', 'Created'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ticketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-4 w-3/4" /></td></tr>
                ))
              ) : ticketsError ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-red-500">
                  Failed to load tickets: {(ticketsError as Error).message}
                </td></tr>
              ) : recentTickets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">No tickets found</td></tr>
              ) : (
                recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 leading-tight">{ticket.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{ticket.referenceNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${PRIORITY_BADGE[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_BADGE[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {ticket.assignee?.name ?? <span className="italic text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right column — 4 cols */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

          {/* Performance */}
          <div className="flex-1 rounded-xl bg-white shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Performance</h3>

            {/* Chart */}
            <div className="h-44 rounded-lg bg-gray-50 border border-dashed border-gray-200 overflow-hidden">
              {seriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seriesData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <Tooltip
                      contentStyle={{ fontSize: 11, border: '1px solid #DFE1E6', borderRadius: 6, backgroundColor: '#fff' }}
                    />
                    <Area type="monotone" dataKey="resolved" stroke="#0052CC" fill="#D4E3FF" strokeWidth={2} name="Resolved" dot={false} />
                    <Area type="monotone" dataKey="created"  stroke="#00B8D9" fill="#B3ECFD" strokeWidth={2} name="Created"  dot={false} opacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ticket Volume</p>
                </div>
              )}
            </div>

            {/* Progress bars */}
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-gray-600">SLA Compliance</span>
                  <span className="text-xs font-bold text-green-600">
                    {complianceRate != null ? `${Math.round(complianceRate * 100)}%` : '—'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: complianceRate != null ? `${Math.round(complianceRate * 100)}%` : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-gray-600">CSAT Score</span>
                  <span className="text-xs font-bold text-blue-500">
                    {csatScore != null ? `${csatScore.toFixed(1)}/5.0` : '—'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: csatScore != null ? `${(csatScore / 5) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="rounded-xl bg-[#091E42] p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">System Health</p>
              <h4 className="text-base font-semibold text-white mt-1">All Services Operational</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 border border-teal-400/40 flex items-center justify-center animate-pulse shrink-0">
              <span
                className="material-symbols-outlined text-teal-400"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
