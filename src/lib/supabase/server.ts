import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Supabase client for use in Server Components, Route Handlers and Server Actions.
 * Must be created fresh per request because it reads/writes cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
          // Called from a Server Component without a mutable cookie jar.
          // Safe to ignore when middleware handles session refresh.
        }
      },
    },
  });
}
