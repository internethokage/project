import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { authApi } from '../lib/api';

interface AuthProps {
  onAuthSuccess?: () => void;
  sessionExpired?: boolean;
}

export function Auth({ onAuthSuccess, sessionExpired }: AuthProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (isSignUp) {
        await authApi.register(email, password);
      } else {
        await authApi.login(email, password);
      }

      // Use flushSync to ensure authenticated state is committed before navigation.
      // Without this, React batches the setState and navigate('/') races ahead of
      // the re-render, causing a brief redirect back to /auth.
      flushSync(() => {
        onAuthSuccess?.();
      });
      navigate('/');
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
          <h1 className="text-2xl font-bold text-sky-950 dark:text-sky-100">
            {isSignUp ? 'Create your account' : 'Sign in to Giftable'}
          </h1>
          <p className="mt-2 text-sm text-sky-700 dark:text-sky-200">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-semibold text-sky-900 underline decoration-sky-400 underline-offset-2 dark:text-cyan-200"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* Session expired banner */}
        {sessionExpired && (
          <div className="rounded-xl border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-200">
            Your session has expired. Please sign in again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-300/70 bg-red-100/70 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-sky-900 dark:text-sky-100">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="aero-input"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-sky-900 dark:text-sky-100">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="aero-input"
              required
              minLength={6}
            />
          </div>

          {isSignUp ? (
            <p className="text-xs text-sky-700 dark:text-sky-200">Password must be at least 6 characters.</p>
          ) : (
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-medium text-sky-900 underline dark:text-cyan-200">
                Forgot password?
              </Link>
            </div>
          )}

          <button type="submit" disabled={loading} className="aero-button w-full disabled:opacity-60">
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
