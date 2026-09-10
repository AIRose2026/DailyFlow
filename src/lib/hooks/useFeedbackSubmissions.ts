"use client";

import { useEffect, useState } from "react";
import type { FeedbackEntry } from "@/lib/clickup/client";

export function useFeedbackSubmissions() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/feedback");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "Laden fehlgeschlagen.");
        if (!cancelled) setEntries(data.feedback ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Laden fehlgeschlagen.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading, error };
}
