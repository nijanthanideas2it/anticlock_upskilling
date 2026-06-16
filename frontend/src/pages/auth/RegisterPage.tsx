import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authService from '../../services/auth.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});
type Fields = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setApiError('');
    try {
      await authService.register(data.name, data.email, data.password);
      navigate('/login', { state: { registered: true } });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setApiError(msg ?? 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#091E42] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <span className="text-lg font-bold text-gray-900">ServiceDesk Pro</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Submit support tickets in minutes</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
          <Input label="Full name"         placeholder="Jane Smith"           error={errors.name?.message}    {...register('name')}     />
          <Input label="Email address"     type="email" placeholder="you@company.com" error={errors.email?.message}   {...register('email')}    />
          <Input label="Password"          type="password" placeholder="Min. 8 chars, upper, number, symbol" error={errors.password?.message} {...register('password')} />
          <Input label="Confirm password"  type="password" placeholder="••••••••" error={errors.confirm?.message}  {...register('confirm')}  />

          {apiError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0" style={{ fontSize: 16 }}>error</span>
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-500 hover:text-blue-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
