"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { EmailTaskWithContext } from "@/lib/supabase/types";

export function useEmailTasks() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [emailTasks, setEmailTasks] = useState<EmailTaskWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("email_tasks")
      .select("*, task:tasks!inner(*)")
      .eq("task.status", "open")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEmailTasks((data as unknown as EmailTaskWithContext[]) ?? []);
      setError(null);
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("email-tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "email_tasks" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  /**
   * Sends the user's spoken/typed reply instruction + mail context to Judith
   * (Langdock agent) via our server-side API route, which holds the API key.
   */
  async function sendPromptToJudith(emailTask: EmailTaskWithContext, prompt: string) {
    const response = await fetch("/api/judith/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailTaskId: emailTask.id,
        outlookFlagId: emailTask.outlook_flag_id,
        subject: emailTask.email_subject,
        sender: emailTask.email_sender,
        preview: emailTask.email_preview,
        prompt,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Judith konnte nicht erreicht werden.");
    }

    return response.json() as Promise<{ ok: true }>;
  }

  return { emailTasks, loading, error, refresh, sendPromptToJudith };
}
