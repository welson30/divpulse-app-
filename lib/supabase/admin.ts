import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS entirely. Only import this
 * from trusted server contexts (Route Handlers under app/api/jobs/*,
 * webhook handlers) per ARCHITECTURE.md §12 "least-privilege access".
 * The `server-only` import makes any accidental client-bundle import a
 * build-time error instead of a leaked service-role key at runtime.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
