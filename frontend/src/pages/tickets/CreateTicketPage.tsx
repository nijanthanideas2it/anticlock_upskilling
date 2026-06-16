import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTicket } from '../../hooks/useTickets';
import api from '../../services/api';
import type { CategoryDTO } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const schema = z.object({
  title:       z.string().min(5, 'At least 5 characters').max(200),
  description: z.string().min(10, 'At least 10 characters').max(5000),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  categoryId:  z.string().uuid('Please select a category'),
});
type Fields = z.infer<typeof schema>;

export function CreateTicketPage() {
  const navigate     = useNavigate();
  const createTicket = useCreateTicket();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [apiError,   setApiError]   = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  useEffect(() => {
    void api.get<{ data: CategoryDTO[] }>('/categories').then((r) => setCategories(r.data.data));
  }, []);

  const onSubmit = async (data: Fields) => {
    setApiError('');
    try {
      const ticket = await createTicket.mutateAsync(data);
      navigate(`/tickets/${ticket.id}`);
    } catch {
      setApiError('Failed to create ticket. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Support Ticket</h1>
        <p className="mt-1 text-sm text-gray-500">Describe your issue and we'll get it resolved as quickly as possible.</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="rounded-xl bg-white shadow-sm p-6 space-y-5">
        <Input
          label="Title"
          placeholder="Briefly describe your issue…"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={5}
            placeholder="Provide as much detail as possible — steps to reproduce, error messages, screenshots, etc."
            className="form-field resize-y"
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select className="form-field" {...register('priority')}>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select className="form-field" {...register('categoryId')}>
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>
        </div>

        {apiError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <span className="material-symbols-outlined text-red-500 shrink-0" style={{ fontSize: 16 }}>error</span>
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
            Submit Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
