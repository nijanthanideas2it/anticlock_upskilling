import prisma from '../config/database';
import type { Role, Prisma } from '@prisma/client';

export async function findById(id: string) {
  return prisma.user.findFirst({ where: { id, deletedAt: null } });
}

export async function findByEmail(email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null } });
}

export async function findByInvitationToken(token: string) {
  return prisma.user.findFirst({ where: { invitationToken: token, deletedAt: null } });
}

export async function findByEmailVerificationToken(token: string) {
  return prisma.user.findFirst({ where: { emailVerificationToken: token, deletedAt: null } });
}

export async function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export async function update(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export async function softDelete(id: string) {
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}

export async function listWithFilters(params: {
  role?: Role;
  isActive?: boolean;
  page: number;
  limit: number;
}) {
  const { role, isActive, page, limit } = params;
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, isAvailable: true, lastLoginAt: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}

export async function revokeAllRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });
}
