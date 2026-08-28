"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { RecurringTask, RecurringTaskCompletion } from "@/lib/supabase/types";
import { currentWeekDays, todayISODate } from "@/lib/utils/date";
import { format } from "date-fns";

interface NewRecurringTaskInput {
  title: string;
  category?: string | null;
  estimated_minutes: number;
}

export function useRecurringTasks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [completions, setCompletions] = useState<RecurringTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const weekStart = format(currentWeekDays()[0]!, "yyyy-MM-dd");

    const [tasksRes, completionsRes] = await Promise.all([
      supabase
        .from("recurring_tasks")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("recurring_task_completions")
        .select("*")
        .gte("completed_date", weekStart),
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

    setLoading(false);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  const today = todayISODate();
  const completedTodayIds = new Set(
    completions.filter((c) => c.completed_date === today).map((c) => c.recurring_task_id)
  );

  const totalPlannedMinutesToday = recurringTasks.reduce(
    (sum, t) => sum + t.estimated_minutes,
    0
  );
  const completedMinutesToday = recurringTasks
    .filter((t) => completedTodayIds.has(t.id))
    .reduce((sum, t) => sum + t.estimated_minutes, 0);

  function isCompletedOn(recurringTaskId: string, date: string) {
    return completions.some(
      (c) => c.recurring_task_id === recurringTaskId && c.completed_date === date
    );
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

  async function createRecurringTask(input: NewRecurringTaskInput) {
    if (!user) return;
    const { error: insertError } = await supabase.from("recurring_tasks").insert({
      user_id: user.id,
      title: input.title,
      category: input.category ?? null,
      estimated_minutes: input.estimated_minutes,
      active: true,
    });
    if (insertError) {
      setError(insertError.message);
    } else {
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
    completions,
    completedTodayIds,
    totalPlannedMinutesToday,
    completedMinutesToday,
    loading,
    error,
    isCompletedOn,
    toggleToday,
    createRecurringTask,
    deactivateRecurringTask,
    refresh,
  };
}
