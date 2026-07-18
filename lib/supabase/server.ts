import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component / Route Handler Supabase client — uses the anon key
 * (still subject to RLS), reading/writing the session via Next's cookie
 * store. Must be created fresh per request; never module-level singleton.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component (not a Route Handler/Server
            // Action) — cookies can't be written here. Safe to ignore as
            // long as middleware.ts is refreshing the session on requests.
          }
        },
      },
    },
  );
}
