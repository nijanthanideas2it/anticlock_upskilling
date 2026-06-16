import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../../services/admin.service';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/EmptyState';
import type { SlaPolicyDTO, TicketPriority } from '../../types';

interface EditState {
  maxResponseMinutes:   number;
  maxResolutionMinutes: number;
  businessHoursOnly:    boolean;
  warningThreshold:     number;
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW:      'text-gray-500',
  MEDIUM:   'text-blue-600',
  HIGH:     'text-amber-600',
  CRITICAL: 'text-red-600',
};

function SlaRow({ policy, onSave }: { policy: SlaPolicyDTO; onSave: (id: string, body: EditState) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState<EditState>({
    maxResponseMinutes:   policy.maxResponseMinutes,
    maxResolutionMinutes: policy.maxResolutionMinutes,
    businessHoursOnly:    policy.businessHoursOnly,
    warningThreshold:     Math.round(policy.warningThreshold * 100),
  });

  const handleSave = async () => {
    if (form.maxResolutionMinutes <= form.maxResponseMinutes) {
      setError('Resolution time must exceed response time');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(policy.id, { ...form, warningThreshold: form.warningThreshold / 100 });
      setEditing(false);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-5 py-4">
        <span className={`font-bold text-sm ${PRIORITY_COLORS[policy.priority]}`}>{policy.priority}</span>
      </td>
      {editing ? (
        <>
          <td className="px-5 py-4"><input type="number" min={1} value={form.maxResponseMinutes}   onChange={(e) => setForm({ ...form, maxResponseMinutes:   Number(e.target.value) })} className={`${inputCls} w-20`} /></td>
          <td className="px-5 py-4"><input type="number" min={1} value={form.maxResolutionMinutes} onChange={(e) => setForm({ ...form, maxResolutionMinutes: Number(e.target.value) })} className={`${inputCls} w-20`} /></td>
          <td className="px-5 py-4">
            <input type="checkbox" checked={form.businessHoursOnly} onChange={(e) => setForm({ ...form, businessHoursOnly: e.target.checked })} className="h-4 w-4 rounded border-gray-300 accent-blue-500" />
          </td>
          <td className="px-5 py-4 flex items-center gap-1">
            <input type="number" min={1} max={99} value={form.warningThreshold} onChange={(e) => setForm({ ...form, warningThreshold: Number(e.target.value) })} className={`${inputCls} w-16`} />
            <span className="text-sm text-gray-500">%</span>
          </td>
          <td className="px-5 py-4">
            <div className="flex gap-2">
              <Button size="sm" loading={saving} onClick={() => void handleSave()}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setError(''); }}>Cancel</Button>
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </td>
        </>
      ) : (
        <>
          <td className="px-5 py-4 text-sm text-gray-700">{policy.maxResponseMinutes} min</td>
          <td className="px-5 py-4 text-sm text-gray-700">{policy.maxResolutionMinutes} min</td>
          <td className="px-5 py-4 text-sm">
            <span className={policy.businessHoursOnly ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {policy.businessHoursOnly ? 'Yes' : 'No'}
            </span>
          </td>
          <td className="px-5 py-4 text-sm text-gray-700">{Math.round(policy.warningThreshold * 100)}%</td>
          <td className="px-5 py-4">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
              Edit
            </Button>
          </td>
        </>
      )}
    </tr>
  );
}

export function SLAManagementPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['sla-policies'], queryFn: adminService.listSlaPolices });
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditState }) => adminService.updateSlaPolicy(id, body),
    onSuccess:  () => void qc.invalidateQueries({ queryKey: ['sla-policies'] }),
  });
  const policies = data?.data ?? [];
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SLA Policies</h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500" style={{ fontSize: 16 }}>info</span>
          <p className="text-sm text-amber-700">Changes apply to new tickets only.</p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header border-b border-gray-200">
                {['Priority', 'Max Response', 'Max Resolution', 'Business Hours', 'Warning At', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <SlaRow key={p.id} policy={p} onSave={async (id, body) => { await updateMut.mutateAsync({ id, body }); }} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
