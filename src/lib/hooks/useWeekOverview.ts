"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { RecurringTask, RecurringTaskCompletion, Task } from "@/lib/supabase/types";
import { currentWeekDays } from "@/lib/utils/date";

export interface DayOverview {
  date: Date;
  iso: string;
  done: number;
  total: number;
}

/**
 * Per-day "X von Y erledigt" for the current week: Y = active recurring
 * tasks (they apply every day) + one-off tasks due that day; X = the
 * matching completions/done tasks. Combines recurring + due tasks per the
 * user's request, rather than only tracking recurring-task completions.
 */
export function useWeekOverview() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [completions, setCompletions] = useState<RecurringTaskCompletion[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const days = currentWeekDays();
      const weekStart = format(days[0]!, "yyyy-MM-dd");
      const weekEnd = format(days[6]!, "yyyy-MM-dd");

      const [recurringRes, completionsRes, tasksRes] = await Promise.all([
        supabase.from("recurring_tasks").select("*").eq("active", true),
        supabase
          .from("recurring_task_completions")
          .select("*")
          .gte("completed_date", weekStart)
          .lte("completed_date", weekEnd),
        supabase.from("tasks").select("*").gte("due_date", weekStart).lte("due_date", weekEnd),
      ]);

      const firstError = recurringRes.error ?? completionsRes.error ?? tasksRes.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setRecurringTasks(recurringRes.data ?? []);
        setCompletions(completionsRes.data ?? []);
        setWeekTasks(tasksRes.data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wochenübersicht konnte nicht geladen werden."
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
      .channel("week-overview-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recurring_tasks",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recurring_task_completions",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  const days: DayOverview[] = currentWeekDays().map((date) => {
    const iso = format(date, "yyyy-MM-dd");
    const dueThatDay = weekTasks.filter((t) => t.due_date === iso);
    const doneThatDay = dueThatDay.filter((t) => t.status === "done").length;
    const recurringDoneThatDay = completions.filter((c) => c.completed_date === iso).length;

    return {
      date,
      iso,
      done: doneThatDay + recurringDoneThatDay,
      total: dueThatDay.length + recurringTasks.length,
    };
  });

  return { days, loading, error, refresh };
}
