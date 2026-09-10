"use client";

import { addWeeks, format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { RecurringTask, RecurringTaskCompletion, Task } from "@/lib/supabase/types";
import { currentWeekDays, routineAppliesOn, weekRangeLabel } from "@/lib/utils/date";

export interface DayOverview {
  date: Date;
  iso: string;
  done: number;
  total: number;
  /** One-off tasks due that day (any status), for the day-detail breakdown. */
  dueTasks: Task[];
  /** Routines scheduled that day, with whether they were completed then. */
  recurringForDay: { task: RecurringTask; done: boolean }[];
}

/**
 * Per-day "X von Y erledigt" for a given week: Y = active recurring tasks
 * (they apply every day, or only their scheduled weekdays) + one-off tasks
 * due that day; X = the matching completions/done tasks. Combines recurring
 * + due tasks per the user's request, rather than only tracking
 * recurring-task completions.
 *
 * `weekOffset` shifts which week is loaded: 0 = this week, -1 = last week,
 * 1 = next week, etc. — lets the Wochenübersicht widget page through past
 * and future weeks.
 */
export function useWeekOverview(weekOffset = 0) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [completions, setCompletions] = useState<RecurringTaskCompletion[]>([]);
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const referenceDate = useMemo(() => addWeeks(new Date(), weekOffset), [weekOffset]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const days = currentWeekDays(referenceDate);
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
  }, [supabase, user, referenceDate]);

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

  const days: DayOverview[] = currentWeekDays(referenceDate).map((date) => {
    const iso = format(date, "yyyy-MM-dd");
    const dueThatDay = weekTasks.filter((t) => t.due_date === iso);
    const doneThatDay = dueThatDay.filter((t) => t.status === "done").length;
    const recurringDoneThatDay = completions.filter((c) => c.completed_date === iso).length;
    // Only count a recurring task on days from its creation date onward (it
    // didn't exist yet on earlier days) and only on the weekdays it's
    // actually scheduled for (empty weekdays = every day).
    const recurringThatDay = recurringTasks.filter(
      (t) =>
        format(new Date(t.created_at), "yyyy-MM-dd") <= iso && routineAppliesOn(t.weekdays, date)
    );

    return {
      date,
      iso,
      done: doneThatDay + recurringDoneThatDay,
      total: dueThatDay.length + recurringThatDay.length,
      dueTasks: dueThatDay,
      recurringForDay: recurringThatDay.map((task) => ({
        task,
        done: completions.some(
          (c) => c.recurring_task_id === task.id && c.completed_date === iso
        ),
      })),
    };
  });

  return { days, weekLabel: weekRangeLabel(referenceDate), loading, error, refresh };
}
