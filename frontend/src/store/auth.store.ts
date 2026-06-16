import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDTO } from '../types';

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  setUser: (user: UserDTO) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth', storage: { getItem: (k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), setItem: (k, v) => sessionStorage.setItem(k, JSON.stringify(v)), removeItem: (k) => sessionStorage.removeItem(k) } },
  ),
);
