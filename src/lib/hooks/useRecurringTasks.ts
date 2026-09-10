"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type {
  RecurringTask,
  RecurringTaskCompletion,
  RecurringTaskTimeEntry,
} from "@/lib/supabase/types";
import { currentWeekDays, routineAppliesOn, todayISODate } from "@/lib/utils/date";
import { format } from "date-fns";

interface NewRecurringTaskInput {
  title: string;
  category?: string | null;
  estimated_minutes: number;
  weekdays?: number[];
}

export function useRecurringTasks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [completions, setCompletions] = useState<RecurringTaskCompletion[]>([]);
  const [activeTimers, setActiveTimers] = useState<RecurringTaskTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const weekStart = format(currentWeekDays()[0]!, "yyyy-MM-dd");

      const [tasksRes, completionsRes, timersRes] = await Promise.all([
        supabase
          .from("recurring_tasks")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: true }),
        supabase
          .from("recurring_task_completions")
          .select("*")
          .gte("completed_date", weekStart),
        supabase.from("recurring_task_time_entries").select("*").is("ended_at", null),
      ]);

      if (tasksRes.error) {
        setError(tasksRes.error.message);
      } else {
        setRecurringTasks(tasksRes.data ?? []);
      }

      if (completionsRes.error) {
        setError(completionsRes.error.message);
      } else {
        setCompletions(completionsRes.data ?? []);
      }

      if (timersRes.error) {
        setError(timersRes.error.message);
      } else {
        setActiveTimers(timersRes.data ?? []);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Routinen konnten nicht geladen werden."
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
      .channel("recurring-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_task_completions" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_tasks" },
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

  const today = todayISODate();
  const now = new Date();
  // Routines that apply today (empty weekdays = every day). Only these
  // count toward "today"'s planned/completed time and appear in the daily
  // list — a routine set for Tuesdays only shouldn't show as an open item
  // on a Monday.
  const todaysRecurringTasks = recurringTasks.filter((t) => routineAppliesOn(t.weekdays, now));

  const completedTodayIds = new Set(
    completions.filter((c) => c.completed_date === today).map((c) => c.recurring_task_id)
  );

  const totalPlannedMinutesToday = todaysRecurringTasks.reduce(
    (sum, t) => sum + t.estimated_minutes,
    0
  );
  const completedMinutesToday = todaysRecurringTasks
    .filter((t) => completedTodayIds.has(t.id))
    .reduce((sum, t) => sum + t.estimated_minutes, 0);

  function isCompletedOn(recurringTaskId: string, date: string) {
    return completions.some(
      (c) => c.recurring_task_id === recurringTaskId && c.completed_date === date
    );
  }

  function activeTimerFor(recurringTaskId: string) {
    return activeTimers.find((t) => t.recurring_task_id === recurringTaskId);
  }

  async function toggleToday(recurringTaskId: string) {
    if (!user) return;
    const alreadyDone = completedTodayIds.has(recurringTaskId);

    if (alreadyDone) {
      setCompletions((prev) =>
        prev.filter(
          (c) => !(c.recurring_task_id === recurringTaskId && c.completed_date === today)
        )
      );
      const { error: deleteError } = await supabase
        .from("recurring_task_completions")
        .delete()
        .eq("recurring_task_id", recurringTaskId)
        .eq("completed_date", today);
      if (deleteError) {
        setError(deleteError.message);
        refresh();
      }
    } else {
      const optimistic: RecurringTaskCompletion = {
        id: `optimistic-${recurringTaskId}`,
        recurring_task_id: recurringTaskId,
        user_id: user.id,
        completed_date: today,
        created_at: new Date().toISOString(),
      };
      setCompletions((prev) => [...prev, optimistic]);
      const { error: insertError } = await supabase.from("recurring_task_completions").insert({
        recurring_task_id: recurringTaskId,
        user_id: user.id,
        completed_date: today,
      });
      if (insertError) {
        setError(insertError.message);
        refresh();
      }
    }
  }

  /** Starts a timing session for a routine (persisted so it survives a reload). */
  async function startTimer(recurringTaskId: string) {
    if (!user) return;
    if (activeTimerFor(recurringTaskId)) return;

    const startedAt = new Date().toISOString();
    const optimistic: RecurringTaskTimeEntry = {
      id: `optimistic-${recurringTaskId}-${startedAt}`,
      recurring_task_id: recurringTaskId,
      user_id: user.id,
      entry_date: today,
      started_at: startedAt,
      ended_at: null,
      duration_seconds: null,
      created_at: startedAt,
    };
    setActiveTimers((prev) => [...prev, optimistic]);

    const { data, error: insertError } = await supabase
      .from("recurring_task_time_entries")
      .insert({
        recurring_task_id: recurringTaskId,
        user_id: user.id,
        entry_date: today,
        started_at: startedAt,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setActiveTimers((prev) => prev.filter((t) => t.id !== optimistic.id));
    } else if (data) {
      setActiveTimers((prev) => prev.map((t) => (t.id === optimistic.id ? data : t)));
    }
  }

  /**
   * Stops the running timer for a routine, records how long it actually
   * took, and — unless it's already marked done today — also completes it,
   * since finishing the timer is the natural signal that the routine is done.
   */
  async function stopTimer(recurringTaskId: string) {
    if (!user) return;
    const entry = activeTimerFor(recurringTaskId);
    if (!entry) return;

    const endedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - new Date(entry.started_at).getTime()) / 1000)
    );

    setActiveTimers((prev) => prev.filter((t) => t.recurring_task_id !== recurringTaskId));

    const { error: updateError } = await supabase
      .from("recurring_task_time_entries")
      .update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds })
      .eq("id", entry.id);

    if (updateError) {
      setError(updateError.message);
    }

    if (!completedTodayIds.has(recurringTaskId)) {
      await toggleToday(recurringTaskId);
    }

    refresh();
  }

  async function createRecurringTask(input: NewRecurringTaskInput) {
    if (!user) return;
    const { error: insertError } = await supabase.from("recurring_tasks").insert({
      user_id: user.id,
      title: input.title,
      category: input.category ?? null,
      estimated_minutes: input.estimated_minutes,
      weekdays: input.weekdays ?? [],
      active: true,
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      refresh();
    }
  }

  async function updateRecurringTask(
    id: string,
    input: {
      title: string;
      category?: string | null;
      estimated_minutes: number;
      weekdays?: number[];
    }
  ) {
    const patch = {
      title: input.title,
      category: input.category ?? null,
      estimated_minutes: input.estimated_minutes,
      weekdays: input.weekdays ?? [],
    };
    setRecurringTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const { error: updateError } = await supabase
      .from("recurring_tasks")
      .update(patch)
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      refresh();
    }
  }

  async function deactivateRecurringTask(id: string) {
    setRecurringTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: updateError } = await supabase
      .from("recurring_tasks")
      .update({ active: false })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      refresh();
    }
  }

  return {
    recurringTasks,
    todaysRecurringTasks,
    completions,
    completedTodayIds,
    totalPlannedMinutesToday,
    completedMinutesToday,
    loading,
    error,
    isCompletedOn,
    activeTimerFor,
    toggleToday,
    startTimer,
    stopTimer,
    createRecurringTask,
    updateRecurringTask,
    deactivateRecurringTask,
    refresh,
  };
}
