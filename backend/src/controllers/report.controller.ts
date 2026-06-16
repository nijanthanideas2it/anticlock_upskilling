import type { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import type { ReportQueryType, TicketReportQueryType } from '../schemas/report.schema';

export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json(await reportService.getOverview(req.query as ReportQueryType)); }
  catch (err) { next(err); }
};

export const getTicketReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json(await reportService.getTicketSeries(req.query as TicketReportQueryType)); }
  catch (err) { next(err); }
};

export const getAgentReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json({ agents: await reportService.getAgentMetrics(req.query as ReportQueryType) }); }
  catch (err) { next(err); }
};

export const getSlaReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json(await reportService.getSlaReport(req.query as ReportQueryType)); }
  catch (err) { next(err); }
};

export const getEscalationReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json(await reportService.getEscalationReport(req.query as ReportQueryType)); }
  catch (err) { next(err); }
};
