"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/supabase/types";

/**
 * Tasks *you* created for someone else via an accepted connection — not
 * your own to-dos (those come from useTasks, scoped to user_id = you), just
 * a lightweight way to see what you've delegated and whether it's done.
 */
export function useAssignedTasks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("created_by", user.id)
        .neq("user_id", user.id)
        .order("status", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks(data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Vergebene Aufgaben konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [supabase, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("assigned-tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `created_by=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  /** Withdraws an assignment you made — deletes the task outright, same as
   * the assignee deleting their own. */
  async function retract(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return { tasks, loading, error, retract, refresh };
}
