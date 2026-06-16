import { useState } from 'react';
import { Button } from '../common/Button';
import type { CommentVisibility } from '../../types';

interface CommentBoxProps {
  onSubmit: (content: string, visibility: CommentVisibility) => Promise<void>;
  showVisibilityToggle?: boolean;
  placeholder?: string;
}

export function CommentBox({
  onSubmit,
  showVisibilityToggle = false,
  placeholder = 'Write a reply…',
}: CommentBoxProps) {
  const [content,    setContent]    = useState('');
  const [visibility, setVisibility] = useState<CommentVisibility>('PUBLIC');
  const [loading,    setLoading]    = useState(false);
  const MAX = 10000;

  const isInternal = visibility === 'INTERNAL';

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onSubmit(content.trim(), visibility);
      setContent('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${isInternal ? 'border-amber-300' : 'border-gray-200'}`}>
      {isInternal && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700">
          Internal note — not visible to customers
        </div>
      )}
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={MAX}
          className="w-full resize-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          aria-label="Comment content"
        />
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{content.length}/{MAX}</span>
            {showVisibilityToggle && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setVisibility(e.target.checked ? 'INTERNAL' : 'PUBLIC')}
                  className="h-3.5 w-3.5 rounded border-gray-300 accent-amber-500"
                />
                <span className="text-xs font-medium text-gray-600">Internal note</span>
              </label>
            )}
          </div>
          <Button size="sm" onClick={handleSubmit} loading={loading} disabled={!content.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
