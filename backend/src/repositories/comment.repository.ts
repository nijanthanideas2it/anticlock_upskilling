import prisma from '../config/database';
import type { CommentVisibility, Prisma } from '@prisma/client';

export async function create(data: Prisma.CommentCreateInput) {
  return prisma.comment.create({
    data,
    include: {
      author: { select: { id: true, name: true, role: true } },
      attachments: true,
    },
  });
}

export async function findById(id: string) {
  return prisma.comment.findFirst({ where: { id, deletedAt: null } });
}

export async function findByTicketId(
  ticketId: string,
  visibilityFilter: CommentVisibility[] | undefined,
  page: number,
  limit: number,
) {
  const where: Prisma.CommentWhereInput = { ticketId, deletedAt: null };
  if (visibilityFilter) where.visibility = { in: visibilityFilter };

  const [data, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, role: true } },
        attachments: true,
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { data, total };
}

export async function softDelete(id: string) {
  return prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
}
