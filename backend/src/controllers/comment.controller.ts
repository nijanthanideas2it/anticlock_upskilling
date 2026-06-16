import type { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service';

export const listComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Number(req.query['page']) || 1;
    const limit = Number(req.query['limit']) || 20;
    const { data, total } = await commentService.listComments(req.params['ticketId']!, req.user!, page, limit);
    res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const comment = await commentService.createComment(req.params['ticketId']!, req.user!, req.body);
    res.status(201).json(comment);
  } catch (err) { next(err); }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await commentService.deleteComment(req.params['id']!, req.user!);
    res.status(204).send();
  } catch (err) { next(err); }
};
