import type { Request, Response, NextFunction } from 'express';
import * as userRepo from '../repositories/user.repository';
import * as authService from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import type { Role } from '@prisma/client';

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query['page']) || 1;
    const limit = Number(req.query['limit']) || 20;
    const role = req.query['role'] as Role | undefined;
    const isActive = req.query['isActive'] !== undefined ? req.query['isActive'] === 'true' : undefined;
    const { data, total } = await userRepo.listWithFilters({ role, isActive, page, limit });
    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, role } = req.body as { name: string; email: string; role: Role };
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered');

    const user = await userRepo.create({ name, email, passwordHash: '', role, isEmailVerified: true });
    await authService.sendInvitation(user.id);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userRepo.findById(req.user!.id);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    const { passwordHash: _p, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userRepo.findById(req.params['id']!);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    const { passwordHash: _p, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await userRepo.update(req.params['id']!, req.body);
    const { passwordHash: _p, ...safe } = updated;
    res.json(safe);
  } catch (err) { next(err); }
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params['id']!;
    await authService.deactivateUserSideEffects(userId);
    await userRepo.update(userId, { isActive: false });
    res.json({ message: 'User deactivated. Open tickets flagged for reassignment.' });
  } catch (err) { next(err); }
};

export const activateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await userRepo.update(req.params['id']!, { isActive: true });
    const { passwordHash: _p, ...safe } = updated;
    res.json(safe);
  } catch (err) { next(err); }
};
