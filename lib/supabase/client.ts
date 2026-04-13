import { createBrowserClient } from '@supabase/ssr';

const PERSISTENT_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 400,
  sameSite: 'lax' as const,
  path: '/',
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: PERSISTENT_COOKIE_OPTIONS,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}
