import api from './api';
import type { UserDTO, PaginatedResponse } from '../types';

export async function listUsers(params?: Record<string, unknown>): Promise<PaginatedResponse<UserDTO>> {
  const res = await api.get<PaginatedResponse<UserDTO>>('/users', { params });
  return res.data;
}

export async function getUser(id: string): Promise<UserDTO> {
  const res = await api.get<UserDTO>(`/users/${id}`);
  return res.data;
}

export async function createUser(body: { name: string; email: string; role: string }): Promise<UserDTO> {
  const res = await api.post<UserDTO>('/users', body);
  return res.data;
}

export async function updateUser(id: string, body: Record<string, unknown>): Promise<UserDTO> {
  const res = await api.put<UserDTO>(`/users/${id}`, body);
  return res.data;
}

export async function deactivateUser(id: string): Promise<void> {
  await api.patch(`/users/${id}/deactivate`);
}

export async function activateUser(id: string): Promise<void> {
  await api.patch(`/users/${id}/activate`);
}
