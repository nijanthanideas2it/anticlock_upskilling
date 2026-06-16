import { useState } from 'react';
import { useUnreadCount, useNotifications, useMarkAllRead, useMarkAsRead } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/date';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadCount();
  const { data } = useNotifications({ limit: 10 });
  const markAllRead = useMarkAllRead();
  const markAsRead  = useMarkAsRead();
  const notifications = data?.data ?? [];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-40">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {count > 0 && (
                <button
                  onClick={() => void markAllRead.mutateAsync()}
                  className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${n.isRead ? '' : 'bg-blue-50/60'}`}
                    onClick={() => { if (!n.isRead) void markAsRead.mutateAsync(n.id); }}
                  >
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className={`flex-1 min-w-0 ${n.isRead ? 'pl-5' : ''}`}>
                      <p className="text-sm text-gray-800 truncate">
                        {n.ticket?.referenceNumber ? (
                          <span className="font-mono text-xs text-gray-500 mr-1">[{n.ticket.referenceNumber}]</span>
                        ) : null}
                        {n.eventType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
