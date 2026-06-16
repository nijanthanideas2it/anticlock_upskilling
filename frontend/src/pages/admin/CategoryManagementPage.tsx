import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../../services/admin.service';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Spinner';
import { EmptyState, ErrorState } from '../../components/common/EmptyState';
import type { CategoryDTO } from '../../types';

function CategoryRow({ category, onToggle, onRename }: {
  category: CategoryDTO;
  onToggle: (id: string, isActive: boolean) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(category.name);

  const handleRename = () => {
    if (name.trim() && name !== category.name) onRename(category.id, name.trim());
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>folder</span>
      </div>

      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') { setName(category.name); setEditing(false); }
          }}
          className="flex-1 rounded-lg border border-blue-400 bg-blue-50 px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          title="Click to rename"
          className={`flex-1 cursor-text text-sm font-medium ${category.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}
        >
          {category.name}
        </span>
      )}

      <label className="flex items-center gap-2 shrink-0 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={category.isActive}
          onChange={(e) => onToggle(category.id, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-blue-500"
        />
        <span className={`text-xs font-medium ${category.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      </label>
    </div>
  );
}

export function CategoryManagementPage() {
  const qc = useQueryClient();
  const [newName,  setNewName]  = useState('');
  const [addError, setAddError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['all-categories'],
    queryFn:  adminService.listCategories,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; isActive?: boolean } }) =>
      adminService.updateCategory(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['all-categories'] }),
  });

  const createMut = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: () => {
      setNewName('');
      void qc.invalidateQueries({ queryKey: ['all-categories'] });
    },
    onError: (e: Error) => setAddError(e.message ?? 'Failed to create category'),
  });

  const categories = data?.data ?? [];
  if (error) return <ErrorState message={(error as Error).message} />;

  const handleAdd = () => {
    setAddError('');
    if (!newName.trim()) return;
    void createMut.mutateAsync(newName.trim());
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
        <p className="mt-0.5 text-sm text-gray-500">{categories.length} categories. Click a name to rename it.</p>
      </div>

      {/* Add new */}
      <div className="flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="New category name…"
          className="form-field flex-1"
        />
        <Button onClick={handleAdd} loading={createMut.isPending} disabled={!newName.trim()}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add
        </Button>
      </div>
      {addError && <p className="text-sm text-red-600">{addError}</p>}

      {/* List */}
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
          : categories.length === 0
          ? <EmptyState title="No categories" description="Add your first category above." />
          : categories.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              onToggle={(id, isActive) => void updateMut.mutateAsync({ id, body: { isActive } })}
              onRename={(id, name) => void updateMut.mutateAsync({ id, body: { name } })}
            />
          ))
        }
      </div>

      <p className="text-xs text-gray-400">Deactivating a category that has active tickets will be rejected by the server.</p>
    </div>
  );
}
