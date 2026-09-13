"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { Connection } from "@/lib/supabase/types";

export interface ConnectionView {
  id: string;
  otherUserId: string;
  otherEmail: string;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing";
  createdAt: string;
}

export type InviteResult = { ok: true } | { ok: false; error: string };

/**
 * Pairwise, mutual-opt-in connections to another DailyFlow user — the basis
 * for assigning a task to someone else. A connection never grants blanket
 * access to the other account; it only unlocks the tasks.created_by RLS
 * check (see 0005_connections.sql) for that one pair.
 */
export function useConnections() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Same "only the first fetch shows a spinner" pattern as the other data
  // hooks — a background realtime-triggered refresh shouldn't unmount
  // whatever's currently rendered from this data.
  const hasLoadedOnce = useRef(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("connections")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRows(data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verbindungen konnten nicht geladen werden.");
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
    // No column filter here on purpose: a connection row involves two
    // different users (requester_id and recipient_id), and postgres_changes
    // filters can't express "either of two columns matches me". RLS (which
    // Realtime enforces per-subscriber for tables with it enabled) already
    // guarantees we're only ever delivered rows we're allowed to select.
    const channel = supabase
      .channel("connections-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () =>
        refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, refresh]);

  const accepted: ConnectionView[] = [];
  const incomingPending: ConnectionView[] = [];
  const outgoingPending: ConnectionView[] = [];

  for (const row of rows) {
    const isRequester = row.requester_id === user?.id;
    const view: ConnectionView = {
      id: row.id,
      otherUserId: isRequester ? row.recipient_id : row.requester_id,
      otherEmail: isRequester ? row.recipient_email : row.requester_email,
      status: row.status,
      direction: isRequester ? "outgoing" : "incoming",
      createdAt: row.created_at,
    };
    if (row.status === "accepted") accepted.push(view);
    else if (view.direction === "incoming") incomingPending.push(view);
    else outgoingPending.push(view);
  }

  async function inviteByEmail(email: string): Promise<InviteResult> {
    if (!user?.email) return { ok: false, error: "Nicht angemeldet." };
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { ok: false, error: "Bitte eine E-Mail-Adresse eingeben." };
    if (normalized === user.email.toLowerCase()) {
      return { ok: false, error: "Das ist deine eigene E-Mail-Adresse." };
    }

    const { data: recipientId, error: rpcError } = await supabase.rpc(
      "find_user_id_by_email",
      { p_email: normalized }
    );
    if (rpcError) return { ok: false, error: rpcError.message };
    if (!recipientId) {
      return { ok: false, error: "Kein DailyFlow-Konto mit dieser E-Mail-Adresse gefunden." };
    }

    const { error: insertError } = await supabase.from("connections").insert({
      requester_id: user.id,
      requester_email: user.email,
      recipient_id: recipientId,
      recipient_email: normalized,
      status: "pending",
    });
    if (insertError) {
      // Unique-pair violation: a request or connection with this person
      // already exists in some direction.
      if (insertError.code === "23505") {
        return { ok: false, error: "Mit dieser Person besteht bereits eine Verbindung oder Anfrage." };
      }
      return { ok: false, error: insertError.message };
    }

    await refresh();
    return { ok: true };
  }

  async function accept(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r)));
    const { error: updateError } = await supabase
      .from("connections")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      refresh();
    }
  }

  // Declining a pending request and disconnecting an accepted one are the
  // same operation: delete the row. Either participant may do it.
  async function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error: deleteError } = await supabase.from("connections").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      refresh();
    }
  }

  return {
    accepted,
    incomingPending,
    outgoingPending,
    loading,
    error,
    inviteByEmail,
    accept,
    decline: remove,
    disconnect: remove,
    refresh,
  };
}
