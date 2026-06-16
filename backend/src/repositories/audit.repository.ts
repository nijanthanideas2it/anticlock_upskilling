import prisma from '../config/database';

export async function findByTicketId(ticketId: string) {
  return prisma.auditLog.findMany({
    where: { ticketId },
    orderBy: { changedAt: 'asc' },
    include: { changedBy: { select: { id: true, name: true } } },
  });
}
