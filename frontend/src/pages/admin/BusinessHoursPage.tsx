import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../../services/admin.service';
import type { BusinessHoursEntry } from '../../services/admin.service';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Spinner';
import { ErrorState } from '../../components/common/EmptyState';

const DAY_LABELS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMEZONES    = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];
const DEFAULT_SCHED: BusinessHoursEntry[] = DAY_LABELS.map((_, i) => ({
  dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: i > 0 && i < 6, timezone: 'UTC',
}));

const timeCls = 'rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-40';

export function BusinessHoursPage() {
  const qc = useQueryClient();
  const [schedule,  setSchedule]  = useState<BusinessHoursEntry[]>(DEFAULT_SCHED);
  const [timezone,  setTimezone]  = useState('UTC');
  const [dirty,     setDirty]     = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data, isLoading, error } = useQuery({ queryKey: ['business-hours'], queryFn: adminService.getBusinessHours });

  useEffect(() => {
    if (data) {
      setTimezone(data.timezone);
      const merged = DEFAULT_SCHED.map((def) => data.schedule.find((s) => s.dayOfWeek === def.dayOfWeek) ?? def);
      setSchedule(merged);
    }
  }, [data]);

  const updateMut = useMutation({
    mutationFn: () => adminService.updateBusinessHours({ timezone, schedule: schedule.map(({ timezone: _tz, ...rest }) => rest) }),
    onSuccess:  () => { setDirty(false); setSaveError(''); void qc.invalidateQueries({ queryKey: ['business-hours'] }); },
    onError:    (e: Error) => setSaveError(e.message ?? 'Failed to save'),
  });

  const updateRow   = (idx: number, patch: Partial<BusinessHoursEntry>) => {
    setSchedule((prev) => prev.map((row, i) => i === idx ? { ...row, ...patch } : row));
    setDirty(true);
  };
  const rowError    = (row: BusinessHoursEntry) => row.isActive && row.startTime >= row.endTime ? 'End must be after start' : '';
  const hasRowErrors = schedule.some((r) => rowError(r));

  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Hours</h1>
          <p className="mt-0.5 text-sm text-gray-500">Define when your support team is available.</p>
        </div>
        <Button
          onClick={() => void updateMut.mutateAsync()}
          loading={updateMut.isPending}
          disabled={!dirty || hasRowErrors}
        >
          Save Changes
        </Button>
      </div>

      {/* Timezone selector */}
      <div className="flex items-center gap-4 rounded-xl bg-white shadow-sm px-5 py-4">
        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 20 }}>public</span>
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => { setTimezone(e.target.value); setDirty(true); }}
          className="form-field max-w-xs"
        >
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      {/* Schedule */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header border-b border-gray-200">
                <th className="px-5 py-3 text-left">Day</th>
                <th className="px-5 py-3 text-left">Active</th>
                <th className="px-5 py-3 text-left">Start</th>
                <th className="px-5 py-3 text-left">End</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, idx) => {
                const err = rowError(row);
                return (
                  <tr key={row.dayOfWeek} className={`border-b border-gray-100 last:border-0 transition-colors ${!row.isActive ? 'bg-gray-50/60 opacity-60' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{DAY_LABELS[row.dayOfWeek]}</td>
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(e) => updateRow(idx, { isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-500"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input type="time" value={row.startTime} disabled={!row.isActive} onChange={(e) => updateRow(idx, { startTime: e.target.value })} className={timeCls} />
                    </td>
                    <td className="px-5 py-3.5">
                      <input type="time" value={row.endTime} disabled={!row.isActive} onChange={(e) => updateRow(idx, { endTime: e.target.value })} className={timeCls} />
                      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {saveError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <span className="material-symbols-outlined text-red-500 shrink-0" style={{ fontSize: 16 }}>error</span>
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}
    </div>
  );
}
