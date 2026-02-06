import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('SIGNED_IN', session);
  } else if (event === 'SIGNED_OUT') {
    console.log('SIGNED_OUT', session);
  }
});

// Sign in anonymously for testing
(async () => {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('Error signing in:', error);
  }
})(); 