import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses Row Level Security.
 *
 * SERVER-ONLY. Never import this file from a Client Component or
 * anything bundled for the browser — the service role key must
 * never reach the client. It's used here only inside API route
 * handlers, after the caller's session has already been verified,
 * so the data pipeline (writing fresh Google Places results) can
 * write to `leads` even though normal users only have read access.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
