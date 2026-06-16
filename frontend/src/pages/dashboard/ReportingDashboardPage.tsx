import { useState, Suspense } from 'react';
import { AreaChart, ResponsiveContainer, XAxis, YAxis, Area, Tooltip } from 'recharts';
import { useOverview, useTicketSeries, useAgentMetrics, useSlaReport } from '../../hooks/useReports';
import { StatCard } from '../../components/dashboard/StatCard';
import { Skeleton } from '../../components/common/Spinner';

type Overview  = { totalTickets?: number; openTickets?: number; avgCsatScore?: number | null };
type SlaReport = { overall?: { complianceRate: number }; currentlyBreached?: { referenceNumber: string; title: string; priority: string }[] };
type SeriesRow = { date: string; created: number; resolved: number };
type AgentRow  = { agentName: string; ticketsHandled: number; slaComplianceRate: number; avgCsatScore: number | null };

export function ReportingDashboardPage() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  const params = { ...(from ? { from } : {}), ...(to ? { to } : {}) };

  const { data: overview, isLoading: ovLoading } = useOverview(params);
  const { data: series }                          = useTicketSeries(params);
  const { data: agents }                          = useAgentMetrics(params);
  const { data: sla }                             = useSlaReport(params);

  const ov          = overview as Overview | undefined;
  const slaData     = sla as SlaReport | undefined;
  const seriesData  = (series as { series?: SeriesRow[] })?.series ?? [];
  const agentData   = (agents as { agents?: AgentRow[] })?.agents ?? [];

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">Performance metrics across your support team.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-gray-600 flex items-center gap-2">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="form-field w-auto"
            />
          </label>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="form-field w-auto"
            />
          </label>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tickets"   value={ov?.totalTickets   ?? null} isLoading={ovLoading} icon="confirmation_number" />
        <StatCard label="Open Tickets"    value={ov?.openTickets    ?? null} isLoading={ovLoading} icon="inbox" />
        <StatCard label="SLA Compliance"  value={slaData?.overall?.complianceRate != null ? Math.round(slaData.overall.complianceRate * 100) : null} suffix="%" isLoading={ovLoading} icon="timer" />
        <StatCard label="Avg CSAT"        value={ov?.avgCsatScore   != null ? (ov.avgCsatScore as number).toFixed(1) : null} suffix=" / 5" isLoading={ovLoading} icon="star" />
      </div>

      {/* Volume chart */}
      {seriesData.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Ticket Volume</h2>
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={seriesData}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B778C' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B778C' }} />
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #DFE1E6', borderRadius: 6, backgroundColor: '#fff' }} />
                <Area type="monotone" dataKey="created"  stroke="#0052CC" fill="#D4E3FF" name="Created"  strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" stroke="#00875A" fill="#ABF5D1" name="Resolved" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      )}

      {/* Agent performance */}
      {agentData.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Agent Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-gray-200">
                  {['Agent', 'Tickets', 'SLA %', 'CSAT'].map((h) => (
                    <th key={h} className="pb-3 pr-6 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agentData.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-6 font-medium text-gray-900">{a.agentName}</td>
                    <td className="py-3 pr-6 text-gray-700">{a.ticketsHandled}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.round(a.slaComplianceRate * 100)}%` }} />
                        </div>
                        <span className="text-gray-700">{Math.round(a.slaComplianceRate * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-700">{a.avgCsatScore?.toFixed(1) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Currently breached */}
      {slaData?.currentlyBreached && slaData.currentlyBreached.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-red-500 animate-pulse" style={{ fontSize: 20 }}>warning</span>
            <h2 className="text-base font-semibold text-red-900">SLA Breached ({slaData.currentlyBreached.length})</h2>
          </div>
          <ul className="divide-y divide-red-100">
            {slaData.currentlyBreached.slice(0, 5).map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded shrink-0">{t.referenceNumber}</span>
                <span className="text-gray-700 truncate flex-1">{t.title}</span>
                <span className="text-xs font-semibold text-red-600 shrink-0">{t.priority}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
