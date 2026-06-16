import prisma from '../config/database';
import type { TicketPriority, Prisma } from '@prisma/client';

export async function findByPriority(priority: TicketPriority) {
  return prisma.slaPolicy.findFirst({ where: { priority, isActive: true } });
}

export async function listAll() {
  return prisma.slaPolicy.findMany({ orderBy: { priority: 'asc' } });
}

export async function create(data: Prisma.SlaPolicyCreateInput) {
  return prisma.slaPolicy.create({ data });
}

export async function update(id: string, data: Prisma.SlaPolicyUpdateInput) {
  return prisma.slaPolicy.update({ where: { id }, data });
}

export async function softDelete(id: string) {
  return prisma.slaPolicy.update({ where: { id }, data: { isActive: false } });
}
