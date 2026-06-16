import prisma from '../config/database';
import { Role, TicketStatus } from '@prisma/client';

export async function findLeastLoadedAgent(): Promise<string | null> {
  const agents = await prisma.user.findMany({
    where: { role: Role.SUPPORT_AGENT, isActive: true, isAvailable: true, deletedAt: null },
    select: { id: true, createdAt: true },
  });

  if (agents.length === 0) return null;

  const openStatuses: TicketStatus[] = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.PENDING,
  ];

  const counts = await Promise.all(
    agents.map(async (agent) => {
      const count = await prisma.ticket.count({
        where: { assigneeId: agent.id, status: { in: openStatuses }, deletedAt: null },
      });
      return { id: agent.id, count, createdAt: agent.createdAt };
    }),
  );

  counts.sort((a, b) => a.count - b.count || a.createdAt.getTime() - b.createdAt.getTime());
  return counts[0]?.id ?? null;
}
