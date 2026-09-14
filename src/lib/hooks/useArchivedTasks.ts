"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/supabase/types";

/** All completed ("done") tasks, newest-completed first, for the Archiv page. */
export function useArchivedTasks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "done")
        .order("updated_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks(data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archiv konnte nicht geladen werden.");
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
      .channel("archived-tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return { tasks, loading, error, deleteTask, refresh };
}
