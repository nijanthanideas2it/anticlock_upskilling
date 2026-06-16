import type { Request, Response, NextFunction } from 'express';
import * as ticketService from '../services/ticket.service';
import * as escalationService from '../services/escalation.service';
import * as auditRepo from '../repositories/audit.repository';
import type { ListTicketsQueryType } from '../schemas/ticket.schema';
import type { TicketStatus } from '@prisma/client';

function paginate(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

export const listTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, total } = await ticketService.listTickets(req.user!, req.query as unknown as ListTicketsQueryType);
    res.json({ data, meta: paginate(total, Number(req.query.page) || 1, Number(req.query.limit) || 20) });
  } catch (err) { next(err); }
};

export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await ticketService.createTicket(req.user!, req.body);
    res.status(201).json(ticket);
  } catch (err) { next(err); }
};

export const getTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await ticketService.getTicket(req.params['id']!, req.user!);
    res.json(ticket);
  } catch (err) { next(err); }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, resolutionNote } = req.body as { status: TicketStatus; resolutionNote?: string };
    const ticket = await ticketService.updateStatus(req.params['id']!, status, req.user!, resolutionNote);
    res.json(ticket);
  } catch (err) { next(err); }
};

export const assignTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await ticketService.assignTicket(req.params['id']!, (req.body as { assigneeId: string }).assigneeId, req.user!);
    res.json(ticket);
  } catch (err) { next(err); }
};

export const claimTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await ticketService.claimTicket(req.params['id']!, req.user!);
    res.json(ticket);
  } catch (err) { next(err); }
};

export const escalateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await escalationService.manualEscalate(req.params['id']!, (req.body as { reason: string }).reason, req.user!);
    res.status(201).json(ticket);
  } catch (err) { next(err); }
};

export const submitCsat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { score, comment } = req.body as { score: number; comment?: string };
    await ticketService.submitCsat(req.params['id']!, req.user!, score, comment);
    res.json({ message: 'Thank you for your feedback.' });
  } catch (err) { next(err); }
};

export const getAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await auditRepo.findByTicketId(req.params['id']!);
    res.json({ data });
  } catch (err) { next(err); }
};
