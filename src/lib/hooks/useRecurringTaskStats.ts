"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type {
  RecurringTask,
  RecurringTaskCompletion,
  RecurringTaskTimeEntry,
} from "@/lib/supabase/types";

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
 *
 * Only days the routine was actually checked off count: a stopped timer
 * alone doesn't "book" time, it just accumulates until the day is marked
 * done, at which point *all* of that day's sessions (however many
 * start/stops it took) count together as one evaluable result.
 */
export function useRecurringTaskStats() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [entries, setEntries] = useState<RecurringTaskTimeEntry[]>([]);
  const [completions, setCompletions] = useState<RecurringTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tasksRes, entriesRes, completionsRes] = await Promise.all([
        supabase.from("recurring_tasks").select("*").order("created_at", { ascending: true }),
        supabase
          .from("recurring_task_time_entries")
          .select("*")
          .not("ended_at", "is", null)
          .order("started_at", { ascending: false }),
        supabase.from("recurring_task_completions").select("*"),
      ]);

      const firstError = tasksRes.error ?? entriesRes.error ?? completionsRes.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setRecurringTasks(tasksRes.data ?? []);
        setEntries(entriesRes.data ?? []);
        setCompletions(completionsRes.data ?? []);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_task_completions" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  // Seconds tracked per (routine, day), but only for days that were
  // actually completed — every completion seeds its key at 0 first, so a
  // day checked off without ever starting a timer stays at 0 and gets
  // filtered out below rather than showing as an evaluable 0-minute result.
  const completedDaySeconds = new Map<string, number>();
  for (const c of completions) {
    completedDaySeconds.set(`${c.recurring_task_id}|${c.completed_date}`, 0);
  }
  for (const e of entries) {
    const key = `${e.recurring_task_id}|${e.entry_date}`;
    if (!completedDaySeconds.has(key)) continue;
    completedDaySeconds.set(key, (completedDaySeconds.get(key) ?? 0) + (e.duration_seconds ?? 0));
  }

  const completedDaySecondsByTask = new Map<string, number[]>();
  for (const [key, seconds] of completedDaySeconds) {
    if (seconds <= 0) continue;
    const taskId = key.slice(0, key.indexOf("|"));
    const list = completedDaySecondsByTask.get(taskId) ?? [];
    list.push(seconds);
    completedDaySecondsByTask.set(taskId, list);
  }

  const stats: RoutineStat[] = recurringTasks.map((task) => {
    const daySeconds = completedDaySecondsByTask.get(task.id) ?? [];
    const sessionCount = daySeconds.length;
    const totalActualMinutes = daySeconds.reduce((sum, s) => sum + s, 0) / 60;
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

  const allCompletedDaySeconds = [...completedDaySeconds.values()].filter((s) => s > 0);
  const totalSessions = allCompletedDaySeconds.length;
  const totalActualMinutesAll = allCompletedDaySeconds.reduce((sum, s) => sum + s, 0) / 60;

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

  /**
   * Permanently removes a routine's record itself (not just its time
   * entries) — for routines already deactivated on the Routinen page,
   * which otherwise keep showing up here forever since this hook
   * deliberately fetches every routine, active or not, to preserve
   * history. The recurring_tasks row's ON DELETE CASCADE takes its
   * completions and time entries with it.
   */
  async function deleteRoutinePermanently(recurringTaskId: string) {
    setRecurringTasks((prev) => prev.filter((t) => t.id !== recurringTaskId));
    setEntries((prev) => prev.filter((e) => e.recurring_task_id !== recurringTaskId));
    const { error: deleteError } = await supabase
      .from("recurring_tasks")
      .delete()
      .eq("id", recurringTaskId);
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
    deleteRoutinePermanently,
    refresh,
  };
}
