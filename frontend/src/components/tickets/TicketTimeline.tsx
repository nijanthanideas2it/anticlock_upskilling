import type { CommentDTO } from '../../types';
import { formatRelativeTime } from '../../utils/date';

interface TicketTimelineProps {
  comments: CommentDTO[];
  currentUserId?: string;
}

export function TicketTimeline({ comments, currentUserId }: TicketTimelineProps) {
  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">No messages yet. Be the first to respond.</p>
    );
  }

  return (
    <div className="space-y-5">
      {comments.map((c) => {
        const isInternal = c.visibility === 'INTERNAL';
        const isMine     = c.author.id === currentUserId;

        return (
          <div key={c.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                isMine ? 'bg-blue-500' : 'bg-gray-300 text-gray-700'
              }`}
            >
              {c.author.name[0]?.toUpperCase()}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 text-xs text-gray-400 ${isMine ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium text-gray-600">{c.author.name}</span>
                {isInternal && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Internal
                  </span>
                )}
                <span>{formatRelativeTime(c.createdAt)}</span>
              </div>

              <div
                className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  isInternal
                    ? 'border border-amber-200 bg-amber-50 text-amber-900'
                    : isMine
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {c.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
