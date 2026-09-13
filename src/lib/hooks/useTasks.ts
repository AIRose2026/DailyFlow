"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  /** Create this task on someone else's list instead of your own — must be
   * the id of a user you have an accepted connection with (RLS enforces
   * this; see 0005_connections.sql). Omit to create it for yourself, as
   * before. */
  assignee_user_id?: string;
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
  // Only the very first fetch should show the loading spinner — every later
  // realtime-triggered refresh flipping loading back to true would swap the
  // whole list out for a spinner mid-session on every change, unmounting
  // (and losing any local UI state of) every card in it.
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        // Explicit even though RLS would also enforce visibility: RLS now
        // also lets a task's creator see it on a connected person's list
        // (see 0005_connections.sql), which must never leak into *your own*
        // Heute/Überfällig/Demnächst — those are only ever tasks assigned
        // to you. Tasks you've assigned to others live in useAssignedTasks
        // instead.
        .eq("user_id", user.id)
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
      hasLoadedOnce.current = true;
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

  async function updateTask(id: string, input: NewTaskInput) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: input.title,
              description: input.description ?? null,
              category: input.category ?? null,
              due_date: input.due_date ?? null,
            }
          : t
      )
    );
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        due_date: input.due_date ?? null,
        updated_at: new Date().toISOString(),
      })
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
    const targetUserId = input.assignee_user_id || user.id;
    const { error: insertError } = await supabase.from("tasks").insert({
      user_id: targetUserId,
      created_by: user.id,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      due_date: input.due_date ?? null,
      status: "open",
      source: "manual",
    });
    if (insertError) {
      setError(insertError.message);
    } else if (targetUserId === user.id) {
      refresh();
    }
    // Assigned to someone else: it'll never show up in this hook's own
    // list (the .eq("user_id", user.id) filter above excludes it), so
    // there's nothing here to refresh — useAssignedTasks picks it up via
    // its own realtime subscription instead.
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
    updateTask,
    refresh,
  };
}
