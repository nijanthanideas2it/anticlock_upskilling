import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../../services/auth.service';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await authService.forgotPassword(email); setSent(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#091E42] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <span className="text-lg font-bold text-gray-900">ServiceDesk Pro</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-2">
              <span className="material-symbols-outlined text-green-600" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-500">If that email is registered, a reset link will arrive shortly.</p>
            <Link to="/login" className="inline-block mt-2 text-sm font-medium text-blue-500 hover:text-blue-600">
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
              <p className="mt-1 text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send reset link
              </Button>
            </form>
            <p className="mt-6 text-center text-sm">
              <Link to="/login" className="text-gray-500 hover:text-gray-700">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
