import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import * as userRepo from '../repositories/user.repository';
import { sendEmail } from '../notifications/email.provider';
import { AppError } from '../middleware/error.middleware';
import type { TokenPayload } from '../types';
import type { Role } from '@prisma/client';

const ACCESS_SECRET = () => process.env['JWT_ACCESS_SECRET'] as string;
const REFRESH_SECRET = () => process.env['JWT_REFRESH_SECRET'] as string;
const ACCESS_TTL = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m';
const REFRESH_TTL = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';
const REFRESH_DAYS = 7;

export function signTokens(payload: TokenPayload) {
  const access = jwt.sign(payload, ACCESS_SECRET(), { expiresIn: ACCESS_TTL } as jwt.SignOptions);
  const refresh = jwt.sign({ id: payload.id }, REFRESH_SECRET(), { expiresIn: REFRESH_TTL } as jwt.SignOptions);
  return { access, refresh };
}

export async function register(name: string, email: string, password: string) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { name, email, passwordHash, role: 'CUSTOMER' as Role, isEmailVerified: true },
    });
    await tx.customer.create({
      data: { primaryContact: name, user: { connect: { id: u.id } } },
    });
    return u;
  });

  return user;
}

export async function verifyEmail(token: string) {
  const user = await userRepo.findByEmailVerificationToken(token);
  if (!user) throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired verification token');
  if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
    throw new AppError(400, 'TOKEN_EXPIRED', 'Verification token has expired');
  }
  await userRepo.update(user.id, {
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiresAt: null,
  });
}

export async function login(email: string, password: string) {
  const user = await userRepo.findByEmail(email);
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  if (!user.isActive) throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'Account has been deactivated');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const customer = user.role === 'CUSTOMER'
    ? await prisma.customer.findFirst({ where: { userId: user.id } })
    : null;

  const payload: TokenPayload = {
    id: user.id, email: user.email, role: user.role,
    ...(customer ? { customerId: customer.id } : {}),
  };

  const { access, refresh } = signTokens(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);

  await prisma.refreshToken.create({ data: { token: refresh, userId: user.id, expiresAt } });
  await userRepo.update(user.id, { lastLoginAt: new Date() });

  return { user, payload, access, refresh };
}

export async function refresh(refreshToken: string) {
  let decoded: { id: string };
  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET()) as { id: string };
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { token: refreshToken, userId: decoded.id, isRevoked: false },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'TOKEN_REVOKED', 'Session expired. Please log in again.');
  }

  const user = await userRepo.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError(401, 'UNAUTHORIZED', 'Account inactive');

  const customer = user.role === 'CUSTOMER'
    ? await prisma.customer.findFirst({ where: { userId: user.id } })
    : null;

  const payload: TokenPayload = {
    id: user.id, email: user.email, role: user.role,
    ...(customer ? { customerId: customer.id } : {}),
  };

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });

  const { access, refresh: newRefresh } = signTokens(payload);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
  await prisma.refreshToken.create({ data: { token: newRefresh, userId: user.id, expiresAt } });

  return { access, refresh: newRefresh, payload };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { isRevoked: true } });
}

export async function forgotPassword(email: string) {
  const user = await userRepo.findByEmail(email);
  if (!user) return;

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordReset.create({ data: { token, userId: user.id, expiresAt } });
  void sendEmail(email, 'PASSWORD_RESET', {
    actionUrl: `${process.env['FRONTEND_URL']}/reset-password?token=${token}`,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordReset.findFirst({
    where: { token, isUsed: false },
  });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError(400, 'INVALID_TOKEN', 'Password reset token is invalid or expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.passwordReset.update({ where: { id: record.id }, data: { isUsed: true } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
  ]);
}

export async function acceptInvitation(token: string, password: string) {
  const user = await userRepo.findByInvitationToken(token);
  if (!user || !user.invitationExpiresAt || user.invitationExpiresAt < new Date()) {
    throw new AppError(400, 'INVALID_TOKEN', 'Invitation token is invalid or expired');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await userRepo.update(user.id, {
    passwordHash,
    isEmailVerified: true,
    invitationToken: null,
    invitationExpiresAt: null,
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'WRONG_PASSWORD', 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userRepo.update(userId, { passwordHash });
}

export async function sendInvitation(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const user = await userRepo.update(userId, { invitationToken: token, invitationExpiresAt: expiresAt });
  void sendEmail(user.email, 'AGENT_INVITED', {
    actionUrl: `${process.env['FRONTEND_URL']}/accept-invitation?token=${token}`,
  });
}

export async function deactivateUserSideEffects(userId: string) {
  await userRepo.revokeAllRefreshTokens(userId);
  await prisma.ticket.updateMany({
    where: { assigneeId: userId, status: { notIn: ['RESOLVED', 'CLOSED'] } },
    data: { assigneeId: null },
  });
}
