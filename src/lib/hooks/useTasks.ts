"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useDayKey } from "@/lib/hooks/useDayKey";
import type { Task } from "@/lib/supabase/types";
import { isDueToday, isOverdue } from "@/lib/utils/date";

interface NewTaskInput {
  title: string;
  description?: string | null;
  category?: string | null;
  due_date?: string | null;
}

export function useTasks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  // Not read directly — just forces a re-render when the calendar day rolls
  // over, so today/overdue below (computed fresh every render) don't stay
  // stuck on yesterday until some unrelated state change happens to
  // trigger one.
  useDayKey();
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
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  const today = tasks.filter((t) => isDueToday(t.due_date, t.created_at));
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.created_at));
  const upcoming = tasks.filter(
    (t) =>
      t.due_date &&
      !isDueToday(t.due_date, t.created_at) &&
      !isOverdue(t.due_date, t.created_at)
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

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
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
      due_date: input.due_date ?? null,
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
    deleteTask,
    createTask,
    refresh,
  };
}
