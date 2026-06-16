import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '../../services/user.service';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Spinner';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import type { Role } from '../../types';

const AGENT_ROLES: Role[] = ['SUPPORT_AGENT', 'SUPPORT_MANAGER', 'ADMIN'];

export function UserManagementPage() {
  const qc = useQueryClient();
  const [page,       setPage]      = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form,       setForm]      = useState({ name: '', email: '', role: 'SUPPORT_AGENT' as Role });
  const [formError,  setFormError]  = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, roleFilter],
    queryFn:  () => userService.listUsers({ page, limit: 20, ...(roleFilter ? { role: roleFilter } : {}) }),
  });

  const deactivateMut = useMutation({
    mutationFn: userService.deactivateUser,
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const activateMut = useMutation({
    mutationFn: userService.activateUser,
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const createMut = useMutation({
    mutationFn: () => userService.createUser({ name: form.name, email: form.email, role: form.role }),
    onSuccess:  () => {
      setInviteOpen(false);
      setForm({ name: '', email: '', role: 'SUPPORT_AGENT' });
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => setFormError(e.message ?? 'Failed to invite user'),
  });

  const users = data?.data ?? [];
  const meta  = data?.meta;

  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">{meta?.total ?? 0} total users</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          Invite Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 font-medium">Filter by role</span>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="form-field max-w-[180px]"
        >
          <option value="">All roles</option>
          {AGENT_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b border-gray-200">
                  {['User', 'Role', 'Status', 'Available', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#091E42] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge value={u.role}>{u.role.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${u.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                        {u.isAvailable ? 'Available' : 'Away'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-5 py-4">
                      {u.isActive ? (
                        <Button variant="ghost" size="sm" onClick={() => void deactivateMut.mutateAsync(u.id)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => void activateMut.mutateAsync(u.id)}>
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {meta.totalPages}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
            Next
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          </Button>
        </div>
      )}

      {/* Invite modal */}
      <Modal isOpen={inviteOpen} onClose={() => { setInviteOpen(false); setFormError(''); }} title="Invite Agent">
        <div className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
          <Input label="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="form-field">
              {AGENT_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setInviteOpen(false); setFormError(''); }}>Cancel</Button>
            <Button loading={createMut.isPending} onClick={() => void createMut.mutateAsync()} disabled={!form.name || !form.email}>
              Send Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
