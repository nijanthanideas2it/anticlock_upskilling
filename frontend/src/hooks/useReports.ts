import { useQuery } from '@tanstack/react-query';
import * as reportService from '../services/report.service';
import type { ReportParams } from '../services/report.service';

export function useOverview(params?: ReportParams) {
  return useQuery({ queryKey: ['reports', 'overview', params], queryFn: () => reportService.getOverview(params), staleTime: 60_000 });
}

export function useTicketSeries(params?: ReportParams & { groupBy?: 'day' | 'week' }) {
  return useQuery({ queryKey: ['reports', 'tickets', params], queryFn: () => reportService.getTicketReport(params), staleTime: 60_000 });
}

export function useAgentMetrics(params?: ReportParams) {
  return useQuery({ queryKey: ['reports', 'agents', params], queryFn: () => reportService.getAgentReport(params), staleTime: 60_000 });
}

export function useSlaReport(params?: ReportParams) {
  return useQuery({ queryKey: ['reports', 'sla', params], queryFn: () => reportService.getSlaReport(params), staleTime: 60_000 });
}

export function useEscalationReport(params?: ReportParams) {
  return useQuery({ queryKey: ['reports', 'escalations', params], queryFn: () => reportService.getEscalationReport(params), staleTime: 60_000 });
}
