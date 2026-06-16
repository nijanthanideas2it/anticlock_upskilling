import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NotificationBell } from '../components/notifications/NotificationBell';

function NavItem({ to, icon, children }: { to: string; icon: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-500 text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      {children}
    </NavLink>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{children}</span>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();

  const isAgent    = user?.role === 'SUPPORT_AGENT';
  const isManager  = user?.role === 'SUPPORT_MANAGER' || user?.role === 'ADMIN';
  const isAdmin    = user?.role === 'ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';
  const initials   = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col bg-[#091E42] overflow-y-auto">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">ServiceDesk Pro</p>
              <p className="text-[10px] text-white/50 leading-tight">Enterprise Support</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {isCustomer && (
            <>
              <NavItem to="/tickets"     icon="inbox">My Tickets</NavItem>
              <NavItem to="/tickets/new" icon="add_circle">New Ticket</NavItem>
            </>
          )}

          {(isAgent || isManager) && (
            <NavItem to="/tickets" icon="inbox">Ticket Queue</NavItem>
          )}

          {isManager && (
            <NavItem to="/dashboard" icon="bar_chart">Reports</NavItem>
          )}

          {isAdmin && (
            <>
              <SectionLabel>Admin</SectionLabel>
              <NavItem to="/admin/dashboard"       icon="dashboard">Dashboard</NavItem>
              <NavItem to="/admin/users"           icon="group">Users</NavItem>
              <NavItem to="/admin/sla"             icon="timer">SLA Policies</NavItem>
              <NavItem to="/admin/categories"      icon="category">Categories</NavItem>
              <NavItem to="/admin/business-hours"  icon="schedule">Business Hours</NavItem>
            </>
          )}
        </nav>

        {/* Footer: user + sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-white/50 truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 h-14 shrink-0 gap-4">
          <div className="relative max-w-xs w-full hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="Search tickets…"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#091E42] flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden lg:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
