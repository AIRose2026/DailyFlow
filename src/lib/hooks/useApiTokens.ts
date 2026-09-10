"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { ApiToken } from "@/lib/supabase/types";

type ApiTokenMeta = Pick<ApiToken, "id" | "name" | "token_prefix" | "last_used_at" | "created_at">;

/** Personal API tokens for the /api/ingest/* endpoints (own Judith setup). */
export function useApiTokens() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tokens, setTokens] = useState<ApiTokenMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("api_tokens")
      .select("id, name, token_prefix, last_used_at, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTokens(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Creates a token and returns its plaintext value — shown exactly once. */
  async function createToken(name: string): Promise<string | null> {
    setError(null);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Token konnte nicht erstellt werden.");
      return null;
    }
    await refresh();
    return data.token as string;
  }

  async function deleteToken(id: string) {
    setTokens((prev) => prev.filter((t) => t.id !== id));
    const { error: deleteError } = await supabase.from("api_tokens").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return { tokens, loading, error, createToken, deleteToken, refresh };
}
