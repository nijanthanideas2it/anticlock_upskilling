import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export const listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json({ data });
  } catch (err) { next(err); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cat = await prisma.category.create({ data: { name: (req.body as { name: string }).name } });
    res.status(201).json(cat);
  } catch (err) { next(err); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cat = await prisma.category.update({ where: { id: req.params['id']! }, data: req.body });
    res.json(cat);
  } catch (err) { next(err); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketCount = await prisma.ticket.count({ where: { categoryId: req.params['id']!, deletedAt: null, status: { notIn: ['RESOLVED', 'CLOSED'] } } });
    if (ticketCount > 0) throw new AppError(409, 'CATEGORY_IN_USE', 'Category has active tickets');
    await prisma.category.update({ where: { id: req.params['id']! }, data: { isActive: false } });
    res.json({ message: 'Category deactivated.' });
  } catch (err) { next(err); }
};
