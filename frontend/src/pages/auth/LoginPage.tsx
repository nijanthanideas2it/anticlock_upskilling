import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Fields = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    setApiError('');
    try {
      await login(data.email, data.password);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setApiError(msg ?? 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[420px] flex-col justify-between bg-[#091E42] px-10 py-12 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <span className="text-lg font-bold text-white">ServiceDesk Pro</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white leading-snug">
            The support platform<br />your team deserves.
          </h2>
          <p className="text-base text-white/60 leading-relaxed">
            Manage tickets, track SLAs, and deliver exceptional customer experiences — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { icon: 'confirmation_number', label: 'Smart Ticketing'   },
              { icon: 'timer',               label: 'SLA Tracking'      },
              { icon: 'bar_chart',           label: 'Live Reports'      },
              { icon: 'notifications',       label: 'Instant Alerts'    },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/70">
                <span className="material-symbols-outlined text-teal-400" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30">© {new Date().getFullYear()} ServiceDesk Pro</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#091E42] flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            </div>
            <span className="text-lg font-bold text-gray-900">ServiceDesk Pro</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {apiError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0" style={{ fontSize: 16 }}>error</span>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/register"        className="text-blue-500 hover:text-blue-600 font-medium">Create account</Link>
            <Link to="/forgot-password" className="text-gray-500 hover:text-gray-700">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
