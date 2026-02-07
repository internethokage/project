import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await api.post<{ message: string; previewResetUrl?: string }>('/api/auth/forgot-password', { email });
      setPreviewResetUrl(response.previewResetUrl || null);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="aero-panel w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sky-950 dark:text-sky-100">Reset your password</h1>
          <p className="mt-2 text-sm text-sky-700 dark:text-sky-200">Enter your email and we'll send you a reset link.</p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-300/70 bg-emerald-100/70 p-4 text-sm text-emerald-900">
              If an account with that email exists, a reset link has been sent.
            </div>
            {previewResetUrl && (
              <div className="rounded-xl border border-sky-200/70 bg-sky-100/70 p-3 text-xs text-sky-900 break-all">
                Dev preview reset link: <a className="underline" href={previewResetUrl}>{previewResetUrl}</a>
              </div>
            )}
            <p className="text-center text-xs text-sky-700 dark:text-sky-200">Check spam folder if needed.</p>
            <Link to="/auth" className="aero-button w-full">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-xl border border-red-300/70 bg-red-100/70 p-3 text-sm text-red-700">{error}</div>}
            <div>
              <label className="mb-1 block text-sm font-medium text-sky-900 dark:text-sky-100">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="aero-input" required />
            </div>
            <button type="submit" disabled={loading} className="aero-button w-full disabled:opacity-60">
              {loading ? 'Sending...' : 'Send reset link'}
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
