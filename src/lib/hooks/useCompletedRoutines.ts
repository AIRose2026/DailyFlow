"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { RecurringTask, RecurringTaskCompletion, RecurringTaskTimeEntry } from "@/lib/supabase/types";

export interface CompletedRoutineEntry {
  completionId: string;
  recurringTaskId: string;
  title: string;
  category: string | null;
  completedDate: string;
  trackedMinutes: number;
}

/**
 * Completed routine instances (one per day a routine was checked off), for
 * the Archiv page — the routine-equivalent of useArchivedTasks. A routine
 * itself is ongoing, so there's no "done" row to select the way tasks have
 * one; each completed day is its own entry here instead.
 */
export function useCompletedRoutines() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<CompletedRoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [completionsRes, timeEntriesRes] = await Promise.all([
        supabase
          .from("recurring_task_completions")
          .select("*, task:recurring_tasks!inner(*)")
          .order("completed_date", { ascending: false }),
        supabase.from("recurring_task_time_entries").select("*").not("ended_at", "is", null),
      ]);

      const firstError = completionsRes.error ?? timeEntriesRes.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        const timeEntries = (timeEntriesRes.data ?? []) as RecurringTaskTimeEntry[];
        const completions = (completionsRes.data ?? []) as unknown as (RecurringTaskCompletion & {
          task: RecurringTask;
        })[];

        const list: CompletedRoutineEntry[] = completions.map((c) => {
          const trackedSeconds = timeEntries
            .filter(
              (e) =>
                e.recurring_task_id === c.recurring_task_id && e.entry_date === c.completed_date
            )
            .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);

          return {
            completionId: c.id,
            recurringTaskId: c.recurring_task_id,
            title: c.task.title,
            category: c.task.category,
            completedDate: c.completed_date,
            trackedMinutes: trackedSeconds / 60,
          };
        });

        setEntries(list);
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
      .channel("archived-routines-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_task_completions" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_task_time_entries" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  /**
   * Un-completes this day for the routine. Not a hard delete — the routine
   * itself keeps existing and its tracked time stays intact — it just
   * removes the completion mark, same as unchecking it on the Routinen page
   * would. If it's today's date, the routine reappears there; either way it
   * drops back out of the statistics (which only count completed days).
   */
  async function uncomplete(completionId: string) {
    setEntries((prev) => prev.filter((e) => e.completionId !== completionId));
    const { error: deleteError } = await supabase
      .from("recurring_task_completions")
      .delete()
      .eq("id", completionId);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return { entries, loading, error, uncomplete, refresh };
}
