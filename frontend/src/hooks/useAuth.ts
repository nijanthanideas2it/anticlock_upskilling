import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import * as authService from '../services/auth.service';
import type { Role } from '../types';

export function useAuth() {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function login(email: string, password: string) {
    const u = await authService.login(email, password);
    setUser(u);
    const paths: Record<Role, string> = {
      ADMIN: '/admin/dashboard',
      SUPPORT_MANAGER: '/dashboard',
      SUPPORT_AGENT: '/tickets',
      CUSTOMER: '/tickets',
    };
    navigate(paths[u.role]);
  }

  async function logout() {
    await authService.logout();
    qc.clear();
    clearUser();
    navigate('/login');
  }

  function hasRole(...roles: Role[]): boolean {
    return !!user && roles.includes(user.role);
  }

  return { user, isAuthenticated, login, logout, hasRole };
}
