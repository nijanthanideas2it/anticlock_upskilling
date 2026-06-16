import type { Request, Response, NextFunction } from 'express';
import * as customerRepo from '../repositories/customer.repository';
import * as userRepo from '../repositories/user.repository';
import * as authService from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';

export const listCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query['page']) || 1;
    const limit = Number(req.query['limit']) || 20;
    const { data, total } = await customerRepo.listWithFilters({
      tier: req.query['tier'] as string | undefined,
      search: req.query['search'] as string | undefined,
      page, limit,
    });
    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, companyName, phone, tier } = req.body as {
      name: string; email: string; companyName?: string; phone?: string; tier?: string;
    };

    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError(409, 'EMAIL_TAKEN', 'Email already registered');

    const user = await userRepo.create({ name, email, passwordHash: '', role: 'CUSTOMER', isEmailVerified: true });
    const customer = await customerRepo.create({
      primaryContact: name, companyName, phone, tier: tier ?? 'standard',
      user: { connect: { id: user.id } },
    });

    await authService.sendInvitation(user.id);
    res.status(201).json(customer);
  } catch (err) { next(err); }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const c = await customerRepo.findById(req.params['id']!);
    if (!c) throw new AppError(404, 'NOT_FOUND', 'Customer not found');
    res.json(c);
  } catch (err) { next(err); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const c = await customerRepo.update(req.params['id']!, req.body);
    res.json(c);
  } catch (err) { next(err); }
};
