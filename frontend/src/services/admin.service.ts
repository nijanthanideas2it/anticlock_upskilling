import api from './api';
import type { SlaPolicyDTO, CategoryDTO } from '../types';

export interface BusinessHoursEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  timezone: string;
}

export async function listSlaPolices(): Promise<{ data: SlaPolicyDTO[] }> {
  const res = await api.get<{ data: SlaPolicyDTO[] }>('/sla-policies');
  return res.data;
}

export async function createSlaPolicy(body: {
  name: string; priority: string; maxResponseMinutes: number;
  maxResolutionMinutes: number; businessHoursOnly: boolean; warningThreshold: number;
}): Promise<SlaPolicyDTO> {
  const res = await api.post<SlaPolicyDTO>('/sla-policies', body);
  return res.data;
}

export async function updateSlaPolicy(id: string, body: {
  maxResponseMinutes?: number; maxResolutionMinutes?: number;
  businessHoursOnly?: boolean; warningThreshold?: number;
}): Promise<SlaPolicyDTO> {
  const res = await api.put<SlaPolicyDTO>(`/sla-policies/${id}`, body);
  return res.data;
}

export async function deleteSlaPolicy(id: string): Promise<void> {
  await api.delete(`/sla-policies/${id}`);
}

export async function listCategories(): Promise<{ data: CategoryDTO[] }> {
  const res = await api.get<{ data: CategoryDTO[] }>('/categories');
  return res.data;
}

export async function createCategory(name: string): Promise<CategoryDTO> {
  const res = await api.post<CategoryDTO>('/categories', { name });
  return res.data;
}

export async function updateCategory(id: string, body: { name?: string; isActive?: boolean }): Promise<CategoryDTO> {
  const res = await api.patch<CategoryDTO>(`/categories/${id}`, body);
  return res.data;
}

export async function getBusinessHours(): Promise<{ timezone: string; schedule: BusinessHoursEntry[] }> {
  const res = await api.get<{ timezone: string; schedule: BusinessHoursEntry[] }>('/config/business-hours');
  return res.data;
}

export async function updateBusinessHours(body: {
  timezone: string;
  schedule: Omit<BusinessHoursEntry, 'timezone'>[];
}): Promise<{ timezone: string; schedule: BusinessHoursEntry[] }> {
  const res = await api.put<{ timezone: string; schedule: BusinessHoursEntry[] }>('/config/business-hours', body);
  return res.data;
}
