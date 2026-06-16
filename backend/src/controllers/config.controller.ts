import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import type { UpdateBusinessHoursBodyType } from '../schemas/config.schema';

export const getBusinessHours = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schedule = await prisma.businessHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    const tz = schedule[0]?.timezone ?? 'UTC';
    res.json({ timezone: tz, schedule });
  } catch (err) { next(err); }
};

export const updateBusinessHours = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { timezone, schedule } = req.body as UpdateBusinessHoursBodyType;
    await Promise.all(
      schedule.map((entry) =>
        prisma.businessHours.upsert({
          where: { dayOfWeek: entry.dayOfWeek },
          update: { ...entry, timezone },
          create: { ...entry, timezone },
        }),
      ),
    );
    const updated = await prisma.businessHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    res.json({ timezone, schedule: updated });
  } catch (err) { next(err); }
};
