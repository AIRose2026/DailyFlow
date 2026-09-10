"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { RecurringTask, RecurringTaskTimeEntry } from "@/lib/supabase/types";

export interface RoutineStat {
  task: RecurringTask;
  sessionCount: number;
  totalActualMinutes: number;
  avgActualMinutes: number;
  plannedMinutes: number;
  /** avgActualMinutes - plannedMinutes; positive = took longer than planned. */
  diffMinutes: number;
}

/**
 * Compares each routine's planned time (estimated_minutes) against the
 * actual time recorded via its start/stop timer sessions
 * (recurring_task_time_entries), for the statistics tab.
 */
export function useRecurringTaskStats() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [entries, setEntries] = useState<RecurringTaskTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tasksRes, entriesRes] = await Promise.all([
        supabase.from("recurring_tasks").select("*").order("created_at", { ascending: true }),
        supabase
          .from("recurring_task_time_entries")
          .select("*")
          .not("ended_at", "is", null)
          .order("started_at", { ascending: false }),
      ]);

      const firstError = tasksRes.error ?? entriesRes.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setRecurringTasks(tasksRes.data ?? []);
        setEntries(entriesRes.data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Statistik konnte nicht geladen werden."
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
      .channel("recurring-stats-changes")
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

  const stats: RoutineStat[] = recurringTasks.map((task) => {
    const taskEntries = entries.filter((e) => e.recurring_task_id === task.id);
    const totalActualSeconds = taskEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
    const sessionCount = taskEntries.length;
    const totalActualMinutes = totalActualSeconds / 60;
    const avgActualMinutes = sessionCount > 0 ? totalActualMinutes / sessionCount : 0;

    return {
      task,
      sessionCount,
      totalActualMinutes,
      avgActualMinutes,
      plannedMinutes: task.estimated_minutes,
      diffMinutes: avgActualMinutes - task.estimated_minutes,
    };
  });

  const totalSessions = entries.length;
  const totalActualMinutesAll = entries.reduce(
    (sum, e) => sum + (e.duration_seconds ?? 0) / 60,
    0
  );

  /** Deletes every recorded time entry for one routine — resets its stats
   * (session count, average, everything) back to "noch keine Zeiterfassung"
   * without touching the routine itself. */
  async function clearRoutineStats(recurringTaskId: string) {
    setEntries((prev) => prev.filter((e) => e.recurring_task_id !== recurringTaskId));
    const { error: deleteError } = await supabase
      .from("recurring_task_time_entries")
      .delete()
      .eq("recurring_task_id", recurringTaskId);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return {
    stats,
    totalSessions,
    totalActualMinutesAll,
    loading,
    error,
    clearRoutineStats,
    refresh,
  };
}
