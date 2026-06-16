import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate =
  (schemas: ValidationSchemas) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as Record<
          string,
          string
        >;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: err.errors
              .map((e) => `${e.path.join('.')}: ${e.message}`)
              .join('; '),
          },
        });
        return;
      }
      next(err);
    }
  };
