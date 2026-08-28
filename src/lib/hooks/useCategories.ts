"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/supabase/types";

export function useCategories() {
  const { user } = useAuth();
  const instanceId = useId();
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setCategories(data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kategorien konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`categories-changes-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh, instanceId]);

  async function addCategory(name: string) {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("Diese Kategorie gibt es schon.");
      return;
    }

    const { error: insertError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name: trimmed });

    if (insertError) {
      setError(insertError.message);
    } else {
      setError(null);
      refresh();
    }
  }

  async function deleteCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return { categories, loading, error, addCategory, deleteCategory, refresh };
}
