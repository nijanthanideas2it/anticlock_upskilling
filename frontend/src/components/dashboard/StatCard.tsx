import { Skeleton } from '../common/Spinner';

interface StatCardProps {
  label: string;
  value: string | number | null;
  isLoading?: boolean;
  suffix?: string;
  icon?: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, isLoading, suffix = '', icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        {icon && (
          <span
            className="material-symbols-outlined text-blue-500"
            style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-9 w-24 mt-1" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 tracking-tight">
          {value != null ? `${value}${suffix}` : '—'}
        </p>
      )}

      {trend && !isLoading && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {trendUp ? 'trending_up' : 'trending_down'}
          </span>
          {trend}
        </div>
      )}
    </div>
  );
}
