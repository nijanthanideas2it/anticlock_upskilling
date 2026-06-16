import prisma from '../config/database';
import type { Prisma } from '@prisma/client';

export async function findById(id: string) {
  return prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: { user: { select: { id: true, email: true, isActive: true } } },
  });
}

export async function findByUserId(userId: string) {
  return prisma.customer.findFirst({
    where: { userId, deletedAt: null },
    include: { user: { select: { id: true, email: true, isActive: true } } },
  });
}

export async function create(data: Prisma.CustomerCreateInput) {
  return prisma.customer.create({
    data,
    include: { user: { select: { id: true, email: true, isActive: true } } },
  });
}

export async function update(id: string, data: Prisma.CustomerUpdateInput) {
  return prisma.customer.update({
    where: { id },
    data,
    include: { user: { select: { id: true, email: true, isActive: true } } },
  });
}

export async function listWithFilters(params: {
  tier?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const { tier, search, page, limit } = params;
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (tier) where.tier = tier;
  if (search) {
    where.OR = [
      { primaryContact: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, isActive: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total };
}

export async function softDelete(id: string) {
  return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
}
