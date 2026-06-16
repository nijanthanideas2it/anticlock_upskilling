import prisma from '../config/database';
import type { TicketStatus, TicketPriority, SlaStatus, Prisma } from '@prisma/client';

const TICKET_INCLUDE = {
  category: true,
  customer: { include: { user: { select: { id: true, email: true } } } },
  assignee: { select: { id: true, name: true } },
  slaPolicy: { select: { id: true, name: true } },
} satisfies Prisma.TicketInclude;

export async function create(data: Prisma.TicketCreateInput) {
  return prisma.ticket.create({ data, include: TICKET_INCLUDE });
}

export async function findById(id: string) {
  return prisma.ticket.findFirst({ where: { id, deletedAt: null }, include: TICKET_INCLUDE });
}

export async function update(id: string, data: Prisma.TicketUpdateInput) {
  return prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });
}

export async function softDelete(id: string) {
  return prisma.ticket.update({ where: { id }, data: { deletedAt: new Date() } });
}

export interface ListTicketsFilter {
  customerId?: string;
  assigneeId?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  slaStatus?: SlaStatus;
  categoryId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listWithFilters(filters: ListTicketsFilter) {
  const {
    customerId, assigneeId, status, priority, slaStatus,
    categoryId, search, page, limit, sortBy = 'slaResponseDue', sortOrder = 'asc',
  } = filters;

  const where: Prisma.TicketWhereInput = { deletedAt: null };
  if (customerId) where.customerId = customerId;
  if (assigneeId !== undefined) where.assigneeId = assigneeId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (slaStatus) where.slaStatus = slaStatus;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.title = { contains: search, mode: 'insensitive' };

  const orderBy: Prisma.TicketOrderByWithRelationInput =
    sortBy === 'priority'
      ? { priority: sortOrder }
      : { [sortBy]: { sort: sortOrder, nulls: 'last' } };

  const [data, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: TICKET_INCLUDE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { data, total };
}

export async function findTicketsDueSoon(now: Date, warningWindowMinutes = 30) {
  const windowEnd = new Date(now.getTime() + warningWindowMinutes * 60000);
  return prisma.ticket.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      OR: [
        { slaResponseDue: { lte: windowEnd }, firstResponseAt: null },
        { slaResolutionDue: { lte: windowEnd } },
      ],
    },
    include: {
      ...TICKET_INCLUDE,
      slaPolicy: true,
    },
  });
}
