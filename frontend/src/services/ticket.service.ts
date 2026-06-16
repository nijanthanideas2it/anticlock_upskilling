import api from './api';
import type { TicketDTO, CommentDTO, PaginatedResponse } from '../types';

export async function listTickets(params: Record<string, unknown>): Promise<PaginatedResponse<TicketDTO>> {
  const res = await api.get<PaginatedResponse<TicketDTO>>('/tickets', { params });
  return res.data;
}

export async function getTicket(id: string): Promise<TicketDTO> {
  const res = await api.get<TicketDTO>(`/tickets/${id}`);
  return res.data;
}

export async function createTicket(body: { title: string; description: string; priority: string; categoryId: string }): Promise<TicketDTO> {
  const res = await api.post<TicketDTO>('/tickets', body);
  return res.data;
}

export async function updateStatus(id: string, body: { status: string; resolutionNote?: string }): Promise<TicketDTO> {
  const res = await api.patch<TicketDTO>(`/tickets/${id}/status`, body);
  return res.data;
}

export async function claimTicket(id: string): Promise<TicketDTO> {
  const res = await api.patch<TicketDTO>(`/tickets/${id}/claim`);
  return res.data;
}

export async function assignTicket(id: string, assigneeId: string): Promise<TicketDTO> {
  const res = await api.patch<TicketDTO>(`/tickets/${id}/assign`, { assigneeId });
  return res.data;
}

export async function escalateTicket(id: string, reason: string): Promise<TicketDTO> {
  const res = await api.post<TicketDTO>(`/tickets/${id}/escalate`, { reason });
  return res.data;
}

export async function submitCsat(id: string, score: number, comment?: string): Promise<void> {
  await api.post(`/tickets/${id}/csat`, { score, comment });
}

export async function getAuditLog(id: string): Promise<{ data: unknown[] }> {
  const res = await api.get<{ data: unknown[] }>(`/tickets/${id}/audit`);
  return res.data;
}

export async function listComments(ticketId: string, page = 1): Promise<PaginatedResponse<CommentDTO>> {
  const res = await api.get<PaginatedResponse<CommentDTO>>(`/tickets/${ticketId}/comments`, { params: { page } });
  return res.data;
}

export async function createComment(ticketId: string, body: { content: string; visibility: string }): Promise<CommentDTO> {
  const res = await api.post<CommentDTO>(`/tickets/${ticketId}/comments`, body);
  return res.data;
}

export async function presignAttachment(ticketId: string, body: { fileName: string; fileSize: number; mimeType: string }) {
  const res = await api.post<{ uploadUrl: string; storageKey: string; expiresIn: number }>(`/tickets/${ticketId}/attachments/presign`, body);
  return res.data;
}

export async function confirmAttachment(ticketId: string, body: { storageKey: string; fileName: string; fileSize: number; mimeType: string }) {
  const res = await api.post(`/tickets/${ticketId}/attachments/confirm`, body);
  return res.data;
}
