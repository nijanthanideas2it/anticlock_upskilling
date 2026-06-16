import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? (
        <div className="mb-4 text-gray-300">{icon}</div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 28 }}>inbox</span>
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && (
        <div className="mt-4">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <span className="material-symbols-outlined text-red-400" style={{ fontSize: 28 }}>error</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">Something went wrong</p>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  );
}
