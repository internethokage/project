import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="aero-panel w-full max-w-md p-8 text-center space-y-4">
          <div className="rounded-xl border border-red-300/70 bg-red-100/70 p-4 text-sm text-red-700">Invalid reset link. The token is missing.</div>
          <Link to="/forgot-password" className="text-sm text-sky-900 underline dark:text-cyan-200">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="aero-panel w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sky-950 dark:text-sky-100">Set new password</h1>
          <p className="mt-2 text-sm text-sky-700 dark:text-sky-200">Enter your new password below.</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-300/70 bg-emerald-100/70 p-4 text-sm text-emerald-900">Your password has been reset successfully.</div>
            <Link to="/auth" className="aero-button w-full">Sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-xl border border-red-300/70 bg-red-100/70 p-3 text-sm text-red-700">{error}</div>}

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-sky-900 dark:text-sky-100">New password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="aero-input" required minLength={6} />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-sky-900 dark:text-sky-100">Confirm new password</label>
              <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="aero-input" required minLength={6} />
            </div>

            <p className="text-xs text-sky-700 dark:text-sky-200">Password must be at least 6 characters.</p>
            <button type="submit" disabled={loading} className="aero-button w-full disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>

            <div className="text-center">
              <Link to="/auth" className="text-sm text-sky-900 underline dark:text-cyan-200">Back to sign in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
