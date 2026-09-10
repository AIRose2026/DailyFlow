import { createServiceClient } from "@/lib/supabase/service";
import { hashApiToken } from "./apiTokens";

/**
 * Resolves the `Authorization: Bearer <token>` header of an incoming
 * /api/ingest/* request to the DailyFlow user it belongs to, using the
 * service role client (no user session exists at this point — the caller
 * is an external automation, not a logged-in browser). Returns null on any
 * missing/invalid/unknown token; callers should respond 401 in that case.
 */
export async function resolveApiToken(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", hashApiToken(token))
    .maybeSingle();

  if (!data) return null;

  // Bookkeeping only — don't let a failure here block the actual request.
  void supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data.user_id;
}
