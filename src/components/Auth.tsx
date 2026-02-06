import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
          }
        });
        
        if (error) throw error;
        
        if (data.user?.identities?.length === 0) {
          setError('This email is already registered. Please sign in instead.');
          setIsSignUp(false);
        } else {
          setMessage('Please check your email for the verification link.');
          setEmail('');
          setPassword('');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Sign in error:', error);
          if (error.message.includes('Email not confirmed')) {
            setError('Please verify your email before signing in.');
          } else {
            setError('Invalid email or password.');
          }
        } else if (data.user) {
          console.log('Signed in successfully');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('Social auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <img src="/google.svg" alt="Google" className="w-5 h-5" />
            <span className="flex-1 text-center text-sm text-gray-700 dark:text-gray-200">
              Continue with Google
            </span>
            <span className="w-5" />
          </button>

          <button
            onClick={() => handleSocialLogin('facebook')}
            className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <img src="/facebook.svg" alt="Facebook" className="w-5 h-5" />
            <span className="flex-1 text-center text-sm text-gray-700 dark:text-gray-200">
              Continue with Facebook
            </span>
            <span className="w-5" />
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}
          
          {message && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              {message}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isSignUp && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By signing up, you agree to our{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </p>
              )}
            </div>
            {!isSignUp && (
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
} 