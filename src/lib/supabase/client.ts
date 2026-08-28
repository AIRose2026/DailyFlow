"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Singleton Supabase client for use in Client Components.
 */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
