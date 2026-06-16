import type { Request, Response, NextFunction } from 'express';
import * as slaRepo from '../repositories/sla.repository';
import { AppError } from '../middleware/error.middleware';

export const listSlaPolicies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ data: await slaRepo.listAll() });
  } catch (err) { next(err); }
};

export const createSlaPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await slaRepo.findByPriority(req.body.priority);
    if (existing) throw new AppError(409, 'POLICY_EXISTS', 'An SLA policy for this priority already exists');
    res.status(201).json(await slaRepo.create(req.body));
  } catch (err) { next(err); }
};

export const updateSlaPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await slaRepo.update(req.params['id']!, req.body));
  } catch (err) { next(err); }
};

export const deleteSlaPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await slaRepo.softDelete(req.params['id']!);
    res.json({ message: 'SLA policy deactivated.' });
  } catch (err) { next(err); }
};
