"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/supabase/types";
import { isDueToday, isOverdue, todayISODate } from "@/lib/utils/date";

interface NewTaskInput {
  title: string;
  description?: string | null;
  category?: string | null;
  due_date?: string | null;
}

export function useTasks() {
  const { user } = useAuth();
  const instanceId = useId();
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("status", "open")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTasks(data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aufgaben konnten nicht geladen werden.");
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
      .channel(`tasks-changes-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh, instanceId]);

  const today = tasks.filter((t) => isDueToday(t.due_date) || !t.due_date);
  const overdue = tasks.filter((t) => isOverdue(t.due_date));
  const upcoming = tasks.filter(
    (t) => t.due_date && !isDueToday(t.due_date) && !isOverdue(t.due_date)
  );

  const categories = Array.from(
    new Set(tasks.map((t) => t.category).filter((c): c is string => Boolean(c)))
  ).sort();

  async function completeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      refresh();
    }
  }

  async function createTask(input: NewTaskInput) {
    if (!user) return;
    const { error: insertError } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      due_date: input.due_date ?? todayISODate(),
      status: "open",
      source: "manual",
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      refresh();
    }
  }

  return {
    tasks,
    today,
    overdue,
    upcoming,
    categories,
    loading,
    error,
    completeTask,
    createTask,
    refresh,
  };
}
