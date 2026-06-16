import prisma from '../config/database';
import type { ReportQueryType, TicketReportQueryType } from '../schemas/report.schema';

function buildDateFilter(from?: string, to?: string) {
  const filter: Record<string, Date> = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return Object.keys(filter).length ? filter : undefined;
}

export async function getOverview(params: ReportQueryType) {
  const { from, to, agentId, categoryId } = params;
  const dateFilter = buildDateFilter(from, to);
  const where = {
    deletedAt: null as null,
    ...(dateFilter ? { createdAt: dateFilter } : {}),
    ...(agentId ? { assigneeId: agentId } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [
    totalTickets, openTickets, resolvedTickets,
    ticketsByStatus, avgCsatRaw, totalEscalations,
  ] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] } } }),
    prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
    prisma.ticket.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.ticket.aggregate({ where: { ...where, csatScore: { not: null } }, _avg: { csatScore: true } }),
    prisma.escalationEvent.count({
      where: {
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        ...(agentId ? { ticket: { assigneeId: agentId } } : {}),
      },
    }),
  ]);

  const slaBreaches = await prisma.ticket.count({ where: { ...where, slaStatus: 'BREACHED' } });
  const slaComplianceRate = totalTickets > 0 ? 1 - slaBreaches / totalTickets : 1;

  const statusMap: Record<string, number> = {};
  ticketsByStatus.forEach((r) => { statusMap[r.status] = r._count.id; });

  return {
    totalTickets, openTickets, resolvedTickets,
    ticketsByStatus: statusMap,
    slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
    avgCsatScore: avgCsatRaw._avg.csatScore ?? null,
    totalEscalations,
    period: { from, to },
  };
}

export async function getTicketSeries(params: TicketReportQueryType) {
  const { from, to } = params;
  const dateFilter = buildDateFilter(from, to);
  const where = { deletedAt: null as null, ...(dateFilter ? { createdAt: dateFilter } : {}) };

  const tickets = await prisma.ticket.findMany({
    where,
    select: { createdAt: true, resolvedAt: true, slaStatus: true },
  });

  const buckets = new Map<string, { date: string; created: number; resolved: number; breached: number }>();

  for (const t of tickets) {
    const key = t.createdAt.toISOString().substring(0, 10);
    const b = buckets.get(key) ?? { date: key, created: 0, resolved: 0, breached: 0 };
    b.created++;
    if (t.resolvedAt) b.resolved++;
    if (t.slaStatus === 'BREACHED') b.breached++;
    buckets.set(key, b);
  }

  return { series: Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date)) };
}

export async function getAgentMetrics(params: ReportQueryType) {
  const { from, to } = params;
  const dateFilter = buildDateFilter(from, to);
  const where = {
    deletedAt: null as null,
    ...(dateFilter ? { createdAt: dateFilter } : {}),
    assigneeId: { not: null },
  };

  const tickets = await prisma.ticket.findMany({
    where,
    select: { assigneeId: true, status: true, slaStatus: true, csatScore: true, firstResponseAt: true, resolvedAt: true, createdAt: true },
  });

  const agentMap = new Map<string, { total: number; resolved: number; breaches: number; csat: number[]; responseMs: number[]; resolutionMs: number[] }>();

  for (const t of tickets) {
    if (!t.assigneeId) continue;
    const a = agentMap.get(t.assigneeId) ?? { total: 0, resolved: 0, breaches: 0, csat: [], responseMs: [], resolutionMs: [] };
    a.total++;
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') a.resolved++;
    if (t.slaStatus === 'BREACHED') a.breaches++;
    if (t.csatScore) a.csat.push(t.csatScore);
    if (t.firstResponseAt) a.responseMs.push(t.firstResponseAt.getTime() - t.createdAt.getTime());
    if (t.resolvedAt) a.resolutionMs.push(t.resolvedAt.getTime() - t.createdAt.getTime());
    agentMap.set(t.assigneeId, a);
  }

  const agents = await prisma.user.findMany({
    where: { id: { in: Array.from(agentMap.keys()) } },
    select: { id: true, name: true },
  });

  const nameMap = new Map(agents.map((a) => [a.id, a.name]));

  return Array.from(agentMap.entries()).map(([id, stats]) => ({
    agentId: id,
    agentName: nameMap.get(id) ?? id,
    ticketsHandled: stats.total,
    ticketsResolved: stats.resolved,
    avgFirstResponseMinutes: stats.responseMs.length > 0
      ? Math.round(stats.responseMs.reduce((s, v) => s + v, 0) / stats.responseMs.length / 60000) : null,
    avgResolutionMinutes: stats.resolutionMs.length > 0
      ? Math.round(stats.resolutionMs.reduce((s, v) => s + v, 0) / stats.resolutionMs.length / 60000) : null,
    slaComplianceRate: stats.total > 0 ? Math.round((1 - stats.breaches / stats.total) * 100) / 100 : 1,
    avgCsatScore: stats.csat.length > 0
      ? Math.round(stats.csat.reduce((s, v) => s + v, 0) / stats.csat.length * 10) / 10 : null,
    escalationCount: stats.breaches,
  }));
}

export async function getSlaReport(params: ReportQueryType) {
  const { from, to } = params;
  const dateFilter = buildDateFilter(from, to);
  const where = { deletedAt: null as null, ...(dateFilter ? { createdAt: dateFilter } : {}) };

  const byPriority = await prisma.ticket.groupBy({
    by: ['priority', 'slaStatus'],
    where,
    _count: { id: true },
  });

  const priorityMap = new Map<string, { total: number; breaches: number }>();
  for (const r of byPriority) {
    const p = priorityMap.get(r.priority) ?? { total: 0, breaches: 0 };
    p.total += r._count.id;
    if (r.slaStatus === 'BREACHED') p.breaches += r._count.id;
    priorityMap.set(r.priority, p);
  }

  const currentlyBreached = await prisma.ticket.findMany({
    where: { ...where, slaStatus: 'BREACHED', status: { notIn: ['RESOLVED', 'CLOSED'] } },
    select: { id: true, referenceNumber: true, title: true, priority: true, slaResolutionDue: true, assignee: { select: { id: true, name: true } } },
    orderBy: { slaResolutionDue: 'asc' },
    take: 20,
  });

  return {
    byPriority: Array.from(priorityMap.entries()).map(([priority, stats]) => ({
      priority,
      total: stats.total,
      breaches: stats.breaches,
      complianceRate: stats.total > 0 ? Math.round((1 - stats.breaches / stats.total) * 100) / 100 : 1,
    })),
    currentlyBreached,
  };
}

export async function getEscalationReport(params: ReportQueryType) {
  const { from, to } = params;
  const dateFilter = buildDateFilter(from, to);
  const where = { ...(dateFilter ? { createdAt: dateFilter } : {}) };

  const [total, byType, reasons, recent] = await Promise.all([
    prisma.escalationEvent.count({ where }),
    prisma.escalationEvent.groupBy({ by: ['type'], where, _count: { id: true } }),
    prisma.escalationEvent.groupBy({ by: ['reason'], where, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    prisma.escalationEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        ticket: { select: { id: true, referenceNumber: true, title: true } },
        escalatedTo: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    total,
    byType: Object.fromEntries(byType.map((r) => [r.type, r._count.id])),
    topReasons: reasons.map((r) => ({ reason: r.reason, count: r._count.id })),
    recentEscalations: recent,
  };
}
