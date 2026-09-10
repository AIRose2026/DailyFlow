import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseUrl } from "./env";

/**
 * Service-role Supabase client for server-only, trusted operations that
 * must bypass Row Level Security — specifically, resolving a personal API
 * token (see src/lib/tokens/) to the DailyFlow user it belongs to, before
 * any user session exists, and then writing on that user's behalf from the
 * /api/ingest/* routes.
 *
 * NEVER import this from client-side code and never return the service
 * role key (or this client) to the browser — it belongs only in
 * server-only route handlers.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt. Wird von den /api/ingest/*-Endpunkten benötigt."
    );
  }
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
