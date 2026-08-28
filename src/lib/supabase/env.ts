const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(rawUrl && rawAnonKey);

// Placeholder values so the Supabase client can be constructed even before
// real credentials are set (e.g. during `next build` without .env.local).
// Any actual request made with these will simply fail at runtime — callers
// that need to know whether Supabase is really usable should check
// `supabaseConfigured`.
export const supabaseUrl = rawUrl || "https://placeholder.supabase.co";
export const supabaseAnonKey = rawAnonKey || "placeholder-anon-key";

export function assertSupabaseConfigured() {
  if (!supabaseConfigured) {
    throw new Error(
      "Supabase ist nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen (siehe .env.example)."
    );
  }
}
