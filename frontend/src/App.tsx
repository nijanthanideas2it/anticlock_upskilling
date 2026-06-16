import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAuthStore } from './store/auth.store';
import type { Role } from './types';

import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { TicketListPage } from './pages/tickets/TicketListPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { ReportingDashboardPage } from './pages/dashboard/ReportingDashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { SLAManagementPage } from './pages/admin/SLAManagementPage';
import { CategoryManagementPage } from './pages/admin/CategoryManagementPage';
import { BusinessHoursPage } from './pages/admin/BusinessHoursPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/tickets" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Authenticated */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/tickets" replace />} />
            <Route path="tickets" element={<TicketListPage />} />
            <Route path="tickets/new" element={<CreateTicketPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="dashboard" element={<ProtectedRoute roles={['ADMIN', 'SUPPORT_MANAGER']}><ReportingDashboardPage /></ProtectedRoute>} />
            <Route path="admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="admin/sla" element={<ProtectedRoute roles={['ADMIN']}><SLAManagementPage /></ProtectedRoute>} />
            <Route path="admin/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoryManagementPage /></ProtectedRoute>} />
            <Route path="admin/business-hours" element={<ProtectedRoute roles={['ADMIN']}><BusinessHoursPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
