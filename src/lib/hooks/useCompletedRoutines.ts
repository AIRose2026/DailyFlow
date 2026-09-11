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

  /**
   * Overwrites a completed day's tracked time with one corrected total —
   * for "forgot to stop the timer" days where the real number is way off.
   * Replaces whatever raw start/stop sessions made up that day's total with
   * a single synthetic entry covering the given minutes, rather than
   * exposing each individual session for editing.
   */
  async function updateTrackedMinutes(recurringTaskId: string, date: string, minutes: number) {
    if (!user) return;
    const seconds = Math.max(0, Math.round(minutes * 60));

    setEntries((prev) =>
      prev.map((e) =>
        e.recurringTaskId === recurringTaskId && e.completedDate === date
          ? { ...e, trackedMinutes: seconds / 60 }
          : e
      )
    );

    const { error: deleteError } = await supabase
      .from("recurring_task_time_entries")
      .delete()
      .eq("recurring_task_id", recurringTaskId)
      .eq("entry_date", date);

    if (deleteError) {
      setError(deleteError.message);
      refresh();
      return;
    }

    if (seconds > 0) {
      const startedAt = new Date(`${date}T00:00:00`);
      const endedAt = new Date(startedAt.getTime() + seconds * 1000);
      const { error: insertError } = await supabase.from("recurring_task_time_entries").insert({
        recurring_task_id: recurringTaskId,
        user_id: user.id,
        entry_date: date,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: seconds,
      });
      if (insertError) {
        setError(insertError.message);
        refresh();
      }
    }
  }

  return { entries, loading, error, uncomplete, updateTrackedMinutes, refresh };
}
