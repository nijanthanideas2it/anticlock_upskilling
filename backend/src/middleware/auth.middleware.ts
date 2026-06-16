import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from '../types';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = (req.cookies as Record<string, string | undefined>)?.accessToken;

  if (!token) {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env['JWT_ACCESS_SECRET'] as string,
    ) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please log in again.',
      },
    });
  }
};
