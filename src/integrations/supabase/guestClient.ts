import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://spjcjjbnfbjycsxgtbpz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamNqamJuZmJqeWNzeGd0YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODEyODEsImV4cCI6MjA3MDI1NzI4MX0.zokUi6GV6rXvqq2chrRRboYtli2O1vQvzG10Rz4f5sk";

const GUEST_SESSION_KEY = "dram_guest_session_id";

/**
 * Creates a Supabase client configured with the guest session ID header.
 * This allows RLS policies to identify guest users for SELECT/UPDATE/DELETE operations.
 */
export function createGuestSupabaseClient() {
  const guestSessionId = typeof window !== 'undefined' 
    ? localStorage.getItem(GUEST_SESSION_KEY) 
    : null;

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: guestSessionId 
        ? { 'x-guest-session-id': guestSessionId }
        : {},
    },
  });
}

/**
 * Get a guest-configured Supabase client with a specific session ID.
 */
export function getGuestClient(guestSessionId: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-guest-session-id': guestSessionId },
    },
  });
}
