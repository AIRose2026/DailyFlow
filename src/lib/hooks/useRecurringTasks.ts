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
  // Today's time entries, open and closed — not just the currently running
  // ones. A routine can be started and stopped several times a day, so the
  // "tracked time" for it is the sum of every entry, not just the latest.
  const [timeEntries, setTimeEntries] = useState<RecurringTaskTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const weekStart = format(currentWeekDays()[0]!, "yyyy-MM-dd");
      const today = todayISODate();

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
        // Today's entries (open or closed) plus any still-open entry from an
        // earlier date (e.g. a timer left running overnight) so it stays
        // stoppable even though it won't count toward today's tracked total.
        supabase
          .from("recurring_task_time_entries")
          .select("*")
          .or(`entry_date.eq.${today},ended_at.is.null`),
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
        setTimeEntries(timersRes.data ?? []);
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

  // Forces a re-render every 30s while any timer is running, so the
  // aggregate "getrackt" figure in the header keeps advancing even if
  // nothing else changes in the meantime. Minute-level display doesn't need
  // anything finer-grained than that; the per-card live counter (which does
  // tick every second) is handled locally in RecurringTaskCard instead.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!timeEntries.some((e) => e.ended_at === null)) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [timeEntries]);

  const today = todayISODate();
  const now = new Date();
  // Routines that apply today (empty weekdays = every day). Only these
  // count toward "today"'s planned/tracked time and appear in the daily
  // list — a routine set for Tuesdays only shouldn't show as an open item
  // on a Monday.
  const todaysRecurringTasks = recurringTasks.filter((t) => routineAppliesOn(t.weekdays, now));

  const completedTodayIds = new Set(
    completions.filter((c) => c.completed_date === today).map((c) => c.recurring_task_id)
  );

  // Today's list only shows what's still open — once checked off, a
  // routine drops out of here the same way a completed task drops out of
  // "Heute" (it's still around, just via the Archiv from then on).
  const openTodaysRecurringTasks = todaysRecurringTasks.filter(
    (t) => !completedTodayIds.has(t.id)
  );

  const totalPlannedMinutesToday = todaysRecurringTasks.reduce(
    (sum, t) => sum + t.estimated_minutes,
    0
  );

  function isCompletedOn(recurringTaskId: string, date: string) {
    return completions.some(
      (c) => c.recurring_task_id === recurringTaskId && c.completed_date === date
    );
  }

  function activeTimerFor(recurringTaskId: string) {
    return timeEntries.find((t) => t.recurring_task_id === recurringTaskId && t.ended_at === null);
  }

  /**
   * Seconds already booked today for a routine — every *closed* session,
   * summed. Deliberately excludes a currently running session (that one
   * ticks live in the card itself instead), so this only changes when a
   * timer actually stops, not every second.
   */
  function closedSecondsTodayFor(recurringTaskId: string): number {
    return timeEntries
      .filter(
        (e) =>
          e.recurring_task_id === recurringTaskId && e.entry_date === today && e.ended_at !== null
      )
      .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
  }

  const totalTrackedMinutesToday =
    todaysRecurringTasks.reduce((sum, t) => {
      const closed = closedSecondsTodayFor(t.id);
      const active = activeTimerFor(t.id);
      const live = active
        ? Math.max(0, Math.round((now.getTime() - new Date(active.started_at).getTime()) / 1000))
        : 0;
      return sum + closed + live;
    }, 0) / 60;

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
    setTimeEntries((prev) => [...prev, optimistic]);

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
      setTimeEntries((prev) => prev.filter((t) => t.id !== optimistic.id));
    } else if (data) {
      setTimeEntries((prev) => prev.map((t) => (t.id === optimistic.id ? data : t)));
    }
  }

  /**
   * Stops the running timer for a routine and records how long that session
   * took. Deliberately does NOT touch completion status — several sessions
   * can add up across the day, and only the checkmark marks a routine done.
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

    setTimeEntries((prev) =>
      prev.map((t) =>
        t.id === entry.id
          ? { ...t, ended_at: endedAt.toISOString(), duration_seconds: durationSeconds }
          : t
      )
    );

    const { error: updateError } = await supabase
      .from("recurring_task_time_entries")
      .update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds })
      .eq("id", entry.id);

    if (updateError) {
      setError(updateError.message);
      refresh();
    }
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
    openTodaysRecurringTasks,
    completions,
    completedTodayIds,
    totalPlannedMinutesToday,
    trackedMinutesToday: totalTrackedMinutesToday,
    loading,
    error,
    isCompletedOn,
    activeTimerFor,
    closedSecondsTodayFor,
    toggleToday,
    startTimer,
    stopTimer,
    createRecurringTask,
    updateRecurringTask,
    deactivateRecurringTask,
    refresh,
  };
}
