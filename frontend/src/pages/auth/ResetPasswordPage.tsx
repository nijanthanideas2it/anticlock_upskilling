import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import * as authService from '../../services/auth.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function ResetPasswordPage() {
  const [params]   = useSearchParams();
  const token      = params.get('token') ?? '';
  const navigate   = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      navigate('/login');
    } catch {
      setError('Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <span className="material-symbols-outlined text-red-500" style={{ fontSize: 28 }}>link_off</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">Invalid reset link</p>
          <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#091E42] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <span className="text-lg font-bold text-gray-900">ServiceDesk Pro</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Input label="New password"     type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm password" type="password" placeholder="••••••••"          value={confirm}  onChange={(e) => setConfirm(e.target.value)}  required />
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0" style={{ fontSize: 16 }}>error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <Button type="submit" loading={loading} className="w-full" size="lg">Reset password</Button>
        </form>
      </div>
    </div>
  );
}
