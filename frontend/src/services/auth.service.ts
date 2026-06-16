import api from './api';
import type { UserDTO } from '../types';

export async function login(email: string, password: string): Promise<UserDTO> {
  const res = await api.post<{ user: UserDTO }>('/auth/login', { email, password });
  return res.data.user;
}

export async function register(name: string, email: string, password: string): Promise<void> {
  await api.post('/auth/register', { name, email, password });
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<UserDTO> {
  const res = await api.get<UserDTO>('/users/me');
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}

export async function acceptInvitation(token: string, password: string): Promise<void> {
  await api.post('/auth/accept-invitation', { token, password });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/auth/me/password', { currentPassword, newPassword });
}
