import api from './api';

export interface ReportParams {
  from?: string; to?: string; agentId?: string; categoryId?: string; status?: string;
}

export async function getOverview(params?: ReportParams) {
  const res = await api.get('/reports/overview', { params });
  return res.data;
}

export async function getTicketReport(params?: ReportParams & { groupBy?: 'day' | 'week' }) {
  const res = await api.get('/reports/tickets', { params });
  return res.data;
}

export async function getAgentReport(params?: ReportParams) {
  const res = await api.get('/reports/agents', { params });
  return res.data;
}

export async function getSlaReport(params?: ReportParams) {
  const res = await api.get('/reports/sla', { params });
  return res.data;
}

export async function getEscalationReport(params?: ReportParams) {
  const res = await api.get('/reports/escalations', { params });
  return res.data;
}
